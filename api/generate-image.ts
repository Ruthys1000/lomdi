import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ספק התמונות שנוצרות ב-AI — אח ל-`api/image.ts` (Pexels), מאחורי אותו תפר.
 *
 * בעוד `/api/image` מחפש צילום סטוק, ה-endpoint הזה *מייצר* איור לפי prompt.
 * ה-prompt כבר נבנה בצד הלקוח (`buildImagePrompt`) ונושא את ה-art direction
 * של הלומדה כולה — סגנון, פלטה ומוטיב — כך שכל התמונות בלומדה נראות כסט אחד
 * מעוצב, לא כאוסף אקראי. זה ה-wow: איורים שנעשו *ללומדה הזו*, לא סטוק גנרי.
 *
 * בדיוק כמו ב-Pexels, הבייטים נמשכים **בצד השרת** ומוחזרים מאותו origin, כדי
 * ש-`importAssetFromUrl` יטמיע אותם כ-Blob — תנאי הכרחי ללומדה שרצה מ-`file://`
 * אחרי הייצוא. מפתח ה-API חי כאן בלבד. הספק (Recraft היום) חבוי מאחורי
 * `generateImage`; החלפתו היא שינוי מקומי אחד, כי הלקוח לא יודע מי מרנדר.
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

  const apiKey = process.env.RECRAFT_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ספק התמונות (Recraft) לא הוגדר בשרת.' });
    return;
  }

  const style = typeof req.query.style === 'string' ? req.query.style : undefined;
  const substyle = typeof req.query.substyle === 'string' ? req.query.substyle : undefined;

  try {
    const result = await generateImage(prompt, apiKey, fetch, { style, substyle });
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    const image = await fetch(result.url);
    if (!image.ok) {
      res.status(502).json({ error: 'הורדת התמונה נכשלה.' });
      return;
    }

    const contentType = image.headers.get('content-type') ?? 'image/png';
    const buffer = Buffer.from(await image.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('image generation failed', error);
    res.status(502).json({ error: 'ספק התמונות אינו זמין כרגע.' });
  }
}
