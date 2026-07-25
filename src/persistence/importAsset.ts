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
