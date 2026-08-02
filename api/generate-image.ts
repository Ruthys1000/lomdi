import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ספק התמונות שנוצרות ב-AI — אח ל-`api/image.ts` (Pexels), מאחורי אותו תפר.
 *
 * בעוד `/api/image` מחפש צילום סטוק, ה-endpoint הזה *מייצר* איור לפי prompt.
 * ה-prompt כבר נבנה בצד הלקוח (`buildImagePrompt`) ונושא את ה-art direction
 * של הלומדה כולה — סגנון, פלטה ומוטיב — כך שכל התמונות בלומדה נראות כסט אחד
 * מעוצב, לא כאוסף אקראי. זה ה-wow: איורים שנעשו *ללומדה הזו*, לא סטוק גנרי.
 *
 * בדיוק כמו ב-Pexels, הבייטים מוחזרים מאותו origin עם cache, כדי
 * ש-`importAssetFromUrl` יטמיע אותם כ-Blob — תנאי הכרחי ללומדה שרצה מ-`file://`
 * אחרי הייצוא. מפתח ה-API חי כאן בלבד. הספק נבחר במשתני סביבה (`IMAGE_PROVIDER`,
 * או אוטומטית Gemini כשמוגדר `GEMINI_API_KEY`): Recraft מחזיר URL שנמשך בצד
 * השרת, ו-Gemini מחזיר בייטים מוטמעים ישירות. הלקוח לא יודע מי מרנדר.
 *
 * כשל תמיד רך: כל סטטוס לא-2xx מפיל את הלקוח חזרה לאיור מציב-מקום, אבל הגוף
 * נושא הודעת שגיאה מובחנת (`error`) שעולה עד ה-toast — בדיוק כמו `api/image.ts`.
 */

export const config = { maxDuration: 120 };

const MAX_PROMPT_CHARS = 1000;
const RECRAFT_ENDPOINT = 'https://external.api.recraft.ai/v1/images/generations';

// ברירת מחדל: איור (ולא צילום ריאליסטי) — הוא נראה קוהרנטי יותר על פני סט,
// מתאים ללומדות, ולא סובל מ"uncanny" של צילום מיוצר. גודל רוחבי מתאים לבלוקי
// התמונה (aspectRatio ברירת המחדל שלהם רחב).
const DEFAULT_STYLE = 'digital_illustration';
const DEFAULT_SIZE = '1365x1024';

interface RecraftResponse {
  data?: { url?: string }[];
}

/** תוצאת יצירה: כתובת התמונה שיצר הספק, או שגיאה מובחנת עם קוד סטטוס להחזרה ללקוח */
export type GenerateResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

/**
 * מייצר איור ב-Recraft ומחזיר את כתובתו. סלחני ומדווח בדיוק כמו `searchPexels`:
 * שגיאת מפתח (401/403) או חריגת מכסה (429) מוחזרות מיד עם הודעה ברורה, ללא
 * ניסיון חוזר. מקבל `fetchImpl` להזרקה בבדיקות.
 */
export async function generateImage(
  prompt: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  options: { style?: string; substyle?: string; size?: string } = {},
): Promise<GenerateResult> {
  const body: Record<string, unknown> = {
    prompt,
    model: 'recraftv3',
    style: options.style ?? DEFAULT_STYLE,
    size: options.size ?? DEFAULT_SIZE,
  };
  if (options.substyle) body.substyle = options.substyle;

  let response: Response;
  try {
    response = await fetchImpl(RECRAFT_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 502, error: 'ספק התמונות אינו זמין כרגע.' };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { ok: false, status: 502, error: 'מפתח Recraft שגוי או חסר הרשאה.' };
    }
    if (response.status === 429) {
      return { ok: false, status: 429, error: 'חריגה ממכסת Recraft — נסו שוב מאוחר יותר.' };
    }
    return { ok: false, status: 502, error: 'יצירת התמונה נכשלה.' };
  }

  const data = (await response.json()) as RecraftResponse;
  const url = data.data?.map((item) => item.url).find((src): src is string => typeof src === 'string');
  if (url) return { ok: true, url };

  return { ok: false, status: 502, error: 'הספק לא החזיר תמונה.' };
}

// ─────────────────────────── ספק Gemini ───────────────────────────
// שלא כמו Recraft שמחזיר URL, Gemini מחזיר את התמונה כ-base64 מוטמע
// (inlineData) בגוף התשובה — כך שאין הורדה שנייה: מפענחים ל-Buffer ומחזירים
// ישירות ללקוח. ברירת המחדל של המודל ניתנת לשדרוג דרך משתנה סביבה בלי קוד.

const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash-image';
const geminiEndpoint = (model: string): string =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
  }[];
}

/** תוצאת יצירה מבוססת-בייטים: התמונה המפוענחת + סוגה, או שגיאה מובחנת. */
export type GeneratedImage =
  | { ok: true; contentType: string; data: Buffer }
  | { ok: false; status: number; error: string };

/**
 * מייצר איור ב-Gemini ומחזיר את בייטי התמונה. סלחני ומדווח באותו חוזה כמו
 * `generateImage` (Recraft): שגיאת מפתח/הרשאה (400/401/403) או חריגת מכסה (429)
 * מוחזרות מיד עם הודעה ברורה, ללא ניסיון חוזר. מקבל `fetchImpl` להזרקה בבדיקות.
 */
export async function generateImageWithGemini(
  prompt: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  model: string = process.env.GEMINI_IMAGE_MODEL || GEMINI_DEFAULT_MODEL,
): Promise<GeneratedImage> {
  let response: Response;
  try {
    response = await fetchImpl(geminiEndpoint(model), {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    });
  } catch {
    return { ok: false, status: 502, error: 'ספק התמונות אינו זמין כרגע.' };
  }

  if (!response.ok) {
    // מפתח לא תקין ב-Gemini מוחזר כ-400 (API_KEY_INVALID), הרשאה חסרה כ-403.
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { ok: false, status: 502, error: 'מפתח Gemini שגוי או חסר הרשאה.' };
    }
    if (response.status === 429) {
      return { ok: false, status: 429, error: 'חריגה ממכסת Gemini — נסו שוב מאוחר יותר.' };
    }
    return { ok: false, status: 502, error: 'יצירת התמונה נכשלה.' };
  }

  const payload = (await response.json()) as GeminiResponse;
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        ok: true,
        contentType: part.inlineData.mimeType ?? 'image/png',
        data: Buffer.from(part.inlineData.data, 'base64'),
      };
    }
  }

  return { ok: false, status: 502, error: 'הספק לא החזיר תמונה.' };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'שיטה לא נתמכת.' });
    return;
  }

  const raw = req.query.prompt;
  const prompt = (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '').trim();
  if (!prompt) {
    res.status(400).json({ error: 'חסר תיאור ליצירת התמונה.' });
    return;
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    res.status(413).json({ error: 'תיאור התמונה ארוך מדי.' });
    return;
  }

  // בחירת ספק: הגדרת GEMINI_API_KEY לבד מפעילה את Gemini; IMAGE_PROVIDER דורס
  // במפורש. פריסות Recraft קיימות (בלי מפתח Gemini) ממשיכות לעבוד כרגיל.
  const provider = process.env.IMAGE_PROVIDER ?? (process.env.GEMINI_API_KEY ? 'gemini' : 'recraft');

  // הבייטים תמיד מוחזרים מאותו origin עם cache — כך `importAssetFromUrl` מטמיע
  // אותם כ-Blob, תנאי הכרחי ללומדה שרצה מ-`file://` אחרי הייצוא.
  const sendImage = (contentType: string, buffer: Buffer): void => {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buffer);
  };

  try {
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'ספק התמונות (Gemini) לא הוגדר בשרת.' });
        return;
      }
      const result = await generateImageWithGemini(prompt, apiKey);
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      // Gemini מחזיר את הבייטים ישירות (base64 מוטמע) — אין הורדה שנייה.
      sendImage(result.contentType, result.data);
      return;
    }

    const apiKey = process.env.RECRAFT_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'ספק התמונות (Recraft) לא הוגדר בשרת.' });
      return;
    }
    const style = typeof req.query.style === 'string' ? req.query.style : undefined;
    const substyle = typeof req.query.substyle === 'string' ? req.query.substyle : undefined;

    const result = await generateImage(prompt, apiKey, fetch, { style, substyle });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    // Recraft מחזיר URL — מושכים את הבייטים בצד השרת.
    const image = await fetch(result.url);
    if (!image.ok) {
      res.status(502).json({ error: 'הורדת התמונה נכשלה.' });
      return;
    }
    sendImage(image.headers.get('content-type') ?? 'image/png', Buffer.from(await image.arrayBuffer()));
  } catch (error) {
    console.error('image generation failed', error);
    res.status(502).json({ error: 'ספק התמונות אינו זמין כרגע.' });
  }
}
