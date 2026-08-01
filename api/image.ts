import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ספק התמונות ללומדות שנוצרות ב-AI — פרוקסי ל-Pexels.
 *
 * Claude מייצר תיאור תמונה (query), לא תמונה. ה-endpoint הזה מתרגם תיאור
 * לצילום סטוק אמיתי: מחפש ב-Pexels, **מושך את בייטי התמונה בצד השרת**, ומחזיר
 * אותם מאותו origin. כך הלקוח (`importAssetFromUrl`) מושך בלי CORS ומטמיע את
 * התמונה כ-Blob — תנאי הכרחי ללומדה שרצה מ-`file://`. מפתח ה-API חי כאן בלבד.
 *
 * כשל תמיד רך: כל סטטוס לא-2xx גורם ללקוח ליפול חזרה לאיור מציב-מקום.
 */

export const config = { maxDuration: 30 };

const MAX_QUERY_CHARS = 200;

interface PexelsSearch {
  photos?: { src?: { large?: string } }[];
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
    const search = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!search.ok) {
      res.status(502).json({ error: 'חיפוש התמונה נכשל.' });
      return;
    }

    const data = (await search.json()) as PexelsSearch;
    const imageUrl = data.photos?.[0]?.src?.large;
    if (typeof imageUrl !== 'string') {
      res.status(404).json({ error: 'לא נמצאה תמונה מתאימה.' });
      return;
    }

    const image = await fetch(imageUrl);
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
