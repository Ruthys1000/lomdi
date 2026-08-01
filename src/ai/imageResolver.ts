import type { ImageResolver } from './images';

/**
 * ה-resolver שמחבר את כוונות התמונה ל-endpoint `/api/image` (Pexels בצד השרת).
 *
 * מחזיר כתובת מאותו origin בלבד — כך `resolveImageIntents` מריץ עליה
 * `importAssetFromUrl` בלי CORS, והתמונה נמשכת ומוטמעת כ-Blob. הבחירה בין
 * ספקים (Pexels היום, אולי AI בעתיד) חיה כולה מאחורי ה-endpoint; הלקוח לא
 * יודע מי מחזיר את התמונה.
 */
export const endpointImageResolver: ImageResolver = {
  resolve(query: string): Promise<string | null> {
    const trimmed = query.trim();
    return Promise.resolve(trimmed ? `/api/image?q=${encodeURIComponent(trimmed)}` : null);
  },
};
