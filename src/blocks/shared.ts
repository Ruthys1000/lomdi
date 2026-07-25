import { z } from 'zod';

/** חלקי תוכן שחוזרים בכמה סוגי בלוקים */

export const buttonSchema = z.object({
  enabled: z.boolean(),
  label: z.string(),
  href: z.string(),
  /** נפתח בלשונית חדשה — ברירת מחדל לקישורים חיצוניים */
  newTab: z.boolean(),
});
export type ButtonContent = z.infer<typeof buttonSchema>;

export const createButton = (overrides: Partial<ButtonContent> = {}): ButtonContent => ({
  enabled: false,
  label: 'קראו עוד',
  href: '',
  newTab: true,
  ...overrides,
});

export const aspectRatioSchema = z.enum(['auto', '16:9', '4:3', '1:1', '3:2', '21:9']);
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const roundnessSchema = z.enum(['none', 'small', 'medium', 'large', 'full']);
export type Roundness = z.infer<typeof roundnessSchema>;

/**
 * הפניה לנכס.
 *
 * מחרוזת ריקה = אין נכס עדיין. שים לב שנשמר assetId ולא כתובת: ההמרה
 * לכתובת נעשית ב-resolveAssetUrl, ולכן נתיבי blob לא יכולים לדלוף לתוצר.
 */
export const assetRefSchema = z.string();

/** עוזר לאיסוף נכסים בשימוש — מסנן הפניות ריקות */
export const collectAssetIds = (...ids: (string | undefined)[]): string[] =>
  ids.filter((id): id is string => Boolean(id));
