import type { AssetMeta } from '@/model/types';

/**
 * שליפת הבלובים חזרה מכתובות ה-blob: שב-`assetStore`.
 *
 * `fetch` על `blob:` הוא קריאה מקומית לזיכרון הדפדפן ולא בקשת רשת — היא
 * עובדת גם offline. נכס שכתובתו כבר שוחררה מדולג במקום להפיל את הפעולה.
 *
 * משותף לשמירת קובץ הפרויקט ולייצוא הלומדה. שני מימושים היו נבדלים בדיוק
 * בטיפול בנכס החסר, וזה המקרה שקשה לשחזר ידנית.
 */
export async function collectAssetBlobs(
  assets: AssetMeta[],
  urls: Record<string, string>,
): Promise<Map<string, Blob>> {
  const blobs = new Map<string, Blob>();

  for (const asset of assets) {
    const url = urls[asset.id];
    if (!url) continue;
    try {
      blobs.set(asset.id, await (await fetch(url)).blob());
    } catch {
      // הכתובת שוחררה או שהנכס אינו זמין; הקורא מחליט מה לעשות עם החוסר
    }
  }

  return blobs;
}
