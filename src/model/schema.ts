import { z } from 'zod';
import { getSharedBlockDefinition } from '@/blocks/registry.shared';
import { SCHEMA_VERSION } from './types';

/**
 * סכמות האימות של קובץ הפרויקט.
 *
 * הן רצות בטעינת קובץ פרויקט ובייבוא, ומטרתן לתפוס קובץ פגום או ידני
 * לפני שהוא נטען ל-state ומייצר מסך שבור. הודעות השגיאה בעברית ומיועדות
 * למשתמש קצה (סעיף 13.3).
 */

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'צבע חייב להיות בפורמט הקסדצימלי');

export const blockSettingsSchema = z.object({
  width: z.enum(['narrow', 'normal', 'wide', 'full']),
  alignment: z.enum(['start', 'center', 'end']),
  background: z.enum(['transparent', 'surface', 'primary', 'accent', 'muted']),
  spacingTop: z.enum(['none', 'small', 'medium', 'large']),
  spacingBottom: z.enum(['none', 'small', 'medium', 'large']),
});

export const themeSchema = z.object({
  // תוספת ערכה היא תוספת ל-enum בלבד: קובץ ישן עם ערכה קיימת נשאר תקין,
  // ולכן אין כאן מיגרציה
  preset: z.enum([
    'clean',
    'darkElegant',
    'vivid',
    'warmSand',
    'forest',
    'highContrast',
    'custom',
  ]),
  colors: z.object({
    primary: hexColor,
    secondary: hexColor,
    accent: hexColor,
    background: hexColor,
    surface: hexColor,
    text: hexColor,
    textMuted: hexColor,
    border: hexColor,
  }),
  typography: z.object({
    fontFamily: z.enum(['system', 'heebo', 'assistant', 'rubik']),
    baseSize: z.number().min(12).max(28),
    headingWeight: z.union([z.literal(600), z.literal(700), z.literal(800)]),
    headingStyle: z.enum(['plain', 'underline', 'accentBar']),
  }),
  shape: z.object({
    radius: z.number().min(0).max(40),
    shadow: z.enum(['none', 'soft', 'medium']),
    buttonStyle: z.enum(['solid', 'soft', 'outline']),
    cardStyle: z.enum(['flat', 'bordered', 'elevated']),
  }),
  layout: z.object({
    contentMaxWidth: z.number().min(480).max(1400),
    density: z.enum(['compact', 'comfortable', 'spacious']),
  }),
});

export const navigationSchema = z.object({
  mode: z.enum(['scroll', 'chapters']),
  showProgress: z.boolean(),
  showChapterMenu: z.boolean(),
  showChapterNumber: z.boolean(),
  labels: z.object({
    next: z.string(),
    prev: z.string(),
    menu: z.string(),
    chapter: z.string(),
  }),
});

/**
 * תוכן הבלוק מאומת דינמית מול הרגיסטרי, ולא מול union קשיח.
 * כך הוספת סוג בלוק חדש אינה נוגעת בקובץ הזה.
 */
export const blockSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    // אובייקט ולא z.unknown: השני היה הופך את השדה לאופציונלי, ואז בלוק
    // בלי תוכן כלל היה עובר אימות ומתפוצץ רק בזמן הרינדור
    content: z.record(z.unknown()),
    settings: blockSettingsSchema,
  })
  .superRefine((block, ctx) => {
    const definition = getSharedBlockDefinition(block.type);
    if (!definition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `סוג בלוק שאינו מוכר: ${block.type}`,
        path: ['type'],
      });
      return;
    }

    const result = definition.schema.safeParse(block.content);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `תוכן לא תקין בבלוק מסוג "${definition.label}"`,
        path: ['content'],
      });
    }
  });

export const chapterSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  blocks: z.array(blockSchema),
});

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  direction: z.enum(['rtl', 'ltr']),
  language: z.string().min(2),
  theme: themeSchema,
  navigation: navigationSchema,
  chapters: z.array(chapterSchema),
});

export const assetMetaSchema = z.object({
  id: z.string().min(1),
  originalName: z.string(),
  safeName: z.string().regex(/^[A-Za-z0-9._-]+$/, 'שם הקובץ הפנימי חייב להיות באותיות לטיניות'),
  kind: z.enum(['image', 'video', 'file']),
  mimeType: z.string(),
  size: z.number().nonnegative(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  exportPath: z.string().min(1),
});

export const projectFileSchema = z.object({
  version: z.string().min(1),
  generator: z.object({ name: z.string(), version: z.string() }),
  savedAt: z.string(),
  course: courseSchema,
  assets: z.array(assetMetaSchema),
});

export { SCHEMA_VERSION };
