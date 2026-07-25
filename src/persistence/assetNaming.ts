import { createId } from '@/model/ids';
import type { AssetKind, AssetMeta } from '@/model/types';

/**
 * שמות הקבצים והמגבלות של הנכסים. מודול טהור בכוונה — אין בו Blob, אין
 * IndexedDB ואין DOM — ולכן אפשר לבדוק אותו ישירות.
 *
 * שני כללים מנחים אותו:
 *
 * 1. **השם הפנימי נגזר מהמזהה ולא משם הקובץ שהמשתמש העלה.** "לוגו החברה
 *    (סופי).png" אינו עובר את `assetMetaSchema` (שדורש `^[A-Za-z0-9._-]+$`),
 *    לא שורד ZIP במערכות קבצים שונות ולא בטוח כחלק מכתובת בתוצר. השם
 *    המקורי נשמר ב-`originalName` לתצוגה בלבד.
 * 2. **`exportPath` נקבע כאן פעם אחת.** אותו נתיב משמש גם בתוך קובץ
 *    הפרויקט וגם בתוך ה-ZIP של הלומדה המיוצאת, וכך אין שתי נוסחאות שיכולות
 *    להתפצל.
 */

/**
 * SVG מותר: הוא מוצג אך ורק דרך `<img src>`, וההקשר הזה מנטרל סקריפטים
 * ו-<foreignObject> בתוך הקובץ. אין בפרויקט נתיב שמזריק SVG כ-DOM, ולכן
 * מוסכמת "אין המרת מחרוזת ל-HTML" נשמרת.
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
] as const;

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;

const MB = 1024 * 1024;

/** מגבלות גודל לפי סוג. וידאו גדול נשמר ב-IndexedDB ונארז ל-ZIP — ולכן תקרה נמוכה יותר ממה שהדפדפן מרשה */
export const SIZE_LIMITS: Record<AssetKind, number> = {
  image: 15 * MB,
  video: 200 * MB,
  file: 25 * MB,
};

/** סיומת לפי MIME, ולא לפי שם הקובץ — שם קובץ אפשר לשנות, ה-MIME הוא מה שהדפדפן זיהה */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const FOLDERS: Record<AssetKind, string> = {
  image: 'assets/images',
  video: 'assets/videos',
  file: 'assets/files',
};

export function assetKindFor(mimeType: string): AssetKind | null {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) return 'image';
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType)) return 'video';
  return null;
}

export function extensionFor(mimeType: string): string {
  return EXTENSIONS[mimeType] ?? '.bin';
}

export function isImageAsset(asset: AssetMeta): boolean {
  return asset.kind === 'image';
}

/** בדיקת קבילות לפני ההעלאה. מחזירה הודעה בעברית, כי היא מוצגת למשתמש כמו שהיא. */
export function checkAssetFile(file: { name: string; type: string; size: number }):
  | { ok: true; kind: AssetKind }
  | { ok: false; error: string } {
  const kind = assetKindFor(file.type);

  if (!kind) {
    return {
      ok: false,
      error: `הסוג של "${file.name}" אינו נתמך. אפשר להעלות תמונות (JPG, PNG, WebP, GIF, AVIF, SVG) וסרטונים (MP4, WebM).`,
    };
  }

  if (file.size > SIZE_LIMITS[kind]) {
    return {
      ok: false,
      error: `"${file.name}" גדול מדי (${formatBytes(file.size)}). המגבלה ל${
        kind === 'image' ? 'תמונה' : 'סרטון'
      } היא ${formatBytes(SIZE_LIMITS[kind])}.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, error: `"${file.name}" ריק.` };
  }

  return { ok: true, kind };
}

export interface AssetMetaInput {
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  /** נמסר בייבוא של קובץ פרויקט, כדי לשמר את המזהה שהבלוקים כבר מפנים אליו */
  id?: string;
}

export function buildAssetMeta(input: AssetMetaInput): AssetMeta {
  const kind = assetKindFor(input.mimeType) ?? 'file';
  const id = input.id ?? createId('asset');
  const safeName = `${id}${extensionFor(input.mimeType)}`;

  return {
    id,
    originalName: input.originalName,
    safeName,
    kind,
    mimeType: input.mimeType,
    size: input.size,
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
    exportPath: `${FOLDERS[kind]}/${safeName}`,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} בתים`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}
