import type { AssetMeta } from '@/model/types';
import { buildAssetMeta, checkAssetFile } from './assetNaming';

/**
 * קליטת קובץ שהמשתמש העלה.
 *
 * זה החלק של שכבת הנכסים שנוגע ב-DOM (מדידת ממדים), ולכן הוא מופרד
 * מ-`assetNaming.ts` שנשאר טהור וניתן לבדיקה בלי דפדפן.
 */

export type ImportAssetResult =
  | { ok: true; meta: AssetMeta; blob: Blob }
  | { ok: false; error: string };

/**
 * ממדי התמונה, לתצוגה בספרייה ולשמירה ב-`AssetMeta`.
 *
 * נכשל בשקט ומחזיר undefined: תמונה שהדפדפן לא הצליח לפענח את ממדיה עדיין
 * ניתנת להעלאה ולהצגה, ואין סיבה שכישלון במדידה יחסום את ההעלאה.
 */
function measureImage(blob: Blob): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    const finish = (value: { width: number; height: number } | undefined) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    image.onload = () =>
      finish(
        image.naturalWidth && image.naturalHeight
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : undefined,
      );
    image.onerror = () => finish(undefined);
    image.src = url;
  });
}

export async function importAssetFile(file: File): Promise<ImportAssetResult> {
  const check = checkAssetFile(file);
  if (!check.ok) return check;

  const dimensions = check.kind === 'image' ? await measureImage(file) : undefined;

  const meta = buildAssetMeta({
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    width: dimensions?.width,
    height: dimensions?.height,
  });

  // Blob ולא File: File נושא איתו נתיב ו-lastModified שאין להם משמעות אחרי
  // ההעלאה, ו-structuredClone של IndexedDB שומר אותם ללא צורך
  return { ok: true, meta, blob: new Blob([file], { type: file.type }) };
}

/**
 * שם קובץ סביר מתוך כתובת. השם הזה משמש רק ל-`originalName` (לתצוגה) —
 * השם הפנימי נגזר תמיד מהמזהה ב-`buildAssetMeta`, ולכן תו לא תקין כאן
 * לא יכול לדלוף לתוצר.
 */
function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').filter(Boolean).pop();
    return name && name.length <= 120 ? decodeURIComponent(name) : 'image';
  } catch {
    return 'image';
  }
}

/**
 * קליטת נכס מכתובת — התפר שדרכו מקור תמונות חיצוני (סטוק/AI images) מזין
 * לומדה שנוצרה ב-AI. מושך את הכתובת ל-Blob ומריץ בדיוק את אותו מסלול של
 * העלאת קובץ (בדיקת סוג/גודל, מדידת ממדים, שם פנימי), כך שאין נתיב נכס
 * שני שיכול לסטות מהראשון.
 */
export async function importAssetFromUrl(
  url: string,
  originalName?: string,
): Promise<ImportAssetResult> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return { ok: false, error: `לא ניתן להוריד תמונה מהכתובת שסופקה.` };
  }

  if (!response.ok) {
    return { ok: false, error: `הורדת התמונה נכשלה (שגיאה ${response.status}).` };
  }

  const blob = await response.blob();
  const name = originalName ?? fileNameFromUrl(url);
  const file = new File([blob], name, { type: blob.type });

  return importAssetFile(file);
}
