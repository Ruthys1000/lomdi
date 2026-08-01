import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ספק התמונות ללומדות שנוצרות ב-AI — פרוקסי ל-Pexels.
 *
 * Claude מייצר תיאור תמונה (query), לא תמונה. ה-endpoint הזה מתרגם תיאור
 * לצילום סטוק אמיתי: מחפש ב-Pexels, **מושך את בייטי התמונה בצד השרת**, ומחזיר
 * אותם מאותו origin. כך הלקוח (`importAssetFromUrl`) מושך בלי CORS ומטמיע את
 * התמונה כ-Blob — תנאי הכרחי ללומדה שרצה מ-`file://`. מפתח ה-API חי כאן בלבד.
 *
 * כשל תמיד רך: כל סטטוס לא-2xx גורם ללקוח ליפול חזרה לאיור מציב-מקום. אבל הכשל
 * לא שקט — גוף ה-JSON נושא הודעת שגיאה מובחנת (`error`), שאותה `importAssetFromUrl`
 * קורא ומעביר עד ה-toast של המשתמש. כך "אין תמונות" תמיד מסביר את עצמו.
 */

export const config = { maxDuration: 30 };

const MAX_QUERY_CHARS = 200;

interface PexelsSearch {
  photos?: { src?: { large?: string } }[];
}

/** תוצאת חיפוש: כתובת תמונה, או שגיאה מובחנת עם קוד סטטוס להחזרה ללקוח */
export type SearchResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

/**
 * מתרגם תיאור לכתובת צילום ב-Pexels. סלחני בכוונה: כשחיפוש עם אילוץ אוריינטציה
 * (landscape) לא מחזיר דבר — מנסה שוב בלי האילוץ, כי שאילתות רבות פשוט חסרות
 * צילום רוחבי. שגיאת מפתח (401/403) או חריגת מכסה (429) מוחזרות מיד עם הודעה
 * ברורה, ללא ניסיון חוזר. מקבל `fetchImpl` להזרקה בבדיקות.
 */
export async function searchPexels(
  query: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SearchResult> {
  // ניסיון ראשון עם landscape (מתאים לרוחב בלוקי התמונה), ואז ניסיון רחב יותר.
  for (const orientation of ['landscape', null] as const) {
    const params = new URLSearchParams({ query, per_page: '5' });
    if (orientation) params.set('orientation', orientation);

    let response: Response;
    try {
      response = await fetchImpl(`https://api.pexels.com/v1/search?${params.toString()}`, {
        headers: { Authorization: apiKey },
      });
    } catch {
      return { ok: false, status: 502, error: 'ספק התמונות אינו זמין כרגע.' };
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, status: 502, error: 'מפתח Pexels שגוי או חסר הרשאה.' };
      }
      if (response.status === 429) {
        return { ok: false, status: 429, error: 'חריגה ממכסת Pexels — נסו שוב מאוחר יותר.' };
      }
      return { ok: false, status: 502, error: 'חיפוש התמונה נכשל.' };
    }

    const data = (await response.json()) as PexelsSearch;
    const url = data.photos?.map((photo) => photo.src?.large).find((src): src is string => typeof src === 'string');
    if (url) return { ok: true, url };
    // אפס תוצאות עם האוריינטציה הזו — הסבב הבא מנסה חיפוש רחב יותר.
  }

  return { ok: false, status: 404, error: 'לא נמצאה תמונה מתאימה.' };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'שיטה לא נתמכת.' });
    return;
  }

  const raw = req.query.q;
  const query = (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '').trim();
  if (!query) {
    res.status(400).json({ error: 'חסרה שאילתת תמונה.' });
    return;
  }
  if (query.length > MAX_QUERY_CHARS) {
    res.status(413).json({ error: 'שאילתת התמונה ארוכה מדי.' });
    return;
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ספק התמונות לא הוגדר בשרת.' });
    return;
  }

  try {
    const result = await searchPexels(query, apiKey);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    const image = await fetch(result.url);
    if (!image.ok) {
      res.status(502).json({ error: 'הורדת התמונה נכשלה.' });
      return;
    }

    const contentType = image.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await image.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buffer);
  } catch (error) {
    console.error('image fetch failed', error);
    res.status(502).json({ error: 'ספק התמונות אינו זמין כרגע.' });
  }
}
