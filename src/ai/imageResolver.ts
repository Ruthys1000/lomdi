import type { ImageResolver } from './images';
import { buildImagePrompt, type VisualStyle } from './visualStyle';

/**
 * ה-resolver שמחבר את כוונות התמונה ל-endpoint `/api/image` (Pexels בצד השרת).
 *
 * מחזיר כתובת מאותו origin בלבד — כך `resolveImageIntents` מריץ עליה
 * `importAssetFromUrl` בלי CORS, והתמונה נמשכת ומוטמעת כ-Blob. הבחירה בין
 * ספקים חיה כולה מאחורי ה-endpoint; הלקוח לא יודע מי מחזיר את התמונה.
 */
export const endpointImageResolver: ImageResolver = {
  resolve(query: string): Promise<string | null> {
    const trimmed = query.trim();
    return Promise.resolve(trimmed ? `/api/image?q=${encodeURIComponent(trimmed)}` : null);
  },
};

/**
 * resolver ליצירת תמונות ב-AI (`/api/generate-image`), עם art direction אחיד
 * ללומדה כולה.
 *
 * זהו התאום של `endpointImageResolver`: אותו חוזה (query → כתובת same-origin),
 * אבל במקום לחפש סטוק הוא *מייצר* איור. ה-`VisualStyle` נסגר לתוך ה-resolver,
 * כך שכל קריאה נושאת את אותו סגנון/פלטה/מוטיב — ה-prompt המלא נבנה כאן בצד
 * הלקוח (`buildImagePrompt`), וה-endpoint רק מרנדר אותו. זה מה שמלכד את כל
 * תמונות הלומדה לסט קוהרנטי אחד במקום אוסף אקראי.
 */
export function createGeneratedImageResolver(style: VisualStyle): ImageResolver {
  return {
    resolve(query: string): Promise<string | null> {
      const trimmed = query.trim();
      if (!trimmed) return Promise.resolve(null);
      const prompt = buildImagePrompt(style, trimmed);
      return Promise.resolve(`/api/generate-image?prompt=${encodeURIComponent(prompt)}`);
    },
  };
}
