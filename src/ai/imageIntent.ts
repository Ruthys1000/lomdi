/**
 * "כוונת תמונה" — התיאור שמודל שפה משאיר במקום תמונה.
 *
 * מודל מייצר טקסט, לא תמונות. לכן בלוק שדורש תמונה מגיע מה-AI עם *תיאור*
 * או כתובת, ולא עם `assetId` (שהוא מזהה פנימי שאסור לסמוך עליו). שכבת
 * הקליטה שולפת את הכוונה הזו לצד ומאפסת את הפניית הנכס, וצעד נפרד —
 * `resolveImageIntents` — פותר אותה מול מקור תמונות חיצוני מאוחר יותר.
 *
 * המודול הזה טהור בכוונה (אין בו fetch ואין Blob), כדי ששכבת הקליטה
 * תוכל לצרוך אותו בלי לגרור את שכבת הנכסים.
 */

/** השדה בתוכן הבלוק שמחזיק את הפניית התמונה */
export type ImageField = 'assetId' | 'imageAssetId';

export interface ImageIntent {
  /** מזהה הבלוק שאליו התמונה שייכת */
  blockId: string;
  field: ImageField;
  /** תיאור חופשי לחיפוש/יצירה של תמונה */
  query?: string;
  /** כתובת ישירה, אם המודל סיפק כזו */
  url?: string;
  /** טקסט חלופי לנגישות */
  alt?: string;
}

export interface ImageHint {
  query?: string;
  url?: string;
  alt?: string;
}

const isUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim());

const firstString = (record: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
};

/**
 * קורא רמזי תמונה מתוך תוכן בלוק שהגיע מ-AI. מחזיר null כשאין דבר לפתור.
 * מקבל מגוון שמות שדות כי אין דרך לאכוף על המודל שם אחד קבוע.
 */
export function readImageHint(provided: Record<string, unknown>): ImageHint | null {
  const url = firstString(provided, ['url', 'src', 'imageUrl']);
  const alt = firstString(provided, ['alt', 'imageAlt']);

  // "image" יכול להיות גם כתובת וגם תיאור — מפרידים לפי הצורה
  const image = firstString(provided, ['image']);
  const directUrl = isUrl(url) ? url : isUrl(image) ? image : undefined;

  const query =
    firstString(provided, ['query', 'imageQuery', 'imageDescription', 'imagePrompt']) ??
    (image && !isUrl(image) ? image : undefined);

  if (!directUrl && !query && !alt) return null;

  const hint: ImageHint = {};
  if (directUrl) hint.url = directUrl;
  if (query) hint.query = query;
  if (alt) hint.alt = alt;
  return hint;
}
