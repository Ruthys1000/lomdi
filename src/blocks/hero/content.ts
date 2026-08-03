import { z } from 'zod';
import { assetRefSchema, buttonSchema, collectAssetIds, createButton } from '../shared';

/**
 * וריאציית עיצוב של ה-hero. `.default` דואג שקובץ פרויקט ישן בלי השדה
 * ייטען כ-'centered' ולא ייכשל באימות — מיגרציה בלי קוד מיגרציה.
 */
export const heroVariantSchema = z
  .enum(['centered', 'spotlight', 'panel', 'minimal'])
  .default('centered');
export type HeroVariant = z.infer<typeof heroVariantSchema>;

export const heroContentSchema = z.object({
  variant: heroVariantSchema,
  title: z.string(),
  subtitle: z.string(),
  intro: z.string(),
  /**
   * `theme` הוא ברירת המחדל: הרקע נגזר מצבעי הערכה דרך `--lc-gradient-hero`.
   * קודם ברירת המחדל הייתה גרדיאנט כחול-סגול קשיח בתוך התוכן, ולכן ה-hero —
   * האלמנט הגדול והראשון בעמוד — נראה זהה בכל שמונה הערכות והתנגש עם החמות
   * שבהן. שאר האפשרויות נשארו למי שרוצה צבע משלו.
   */
  backgroundType: z.enum(['theme', 'color', 'gradient', 'image']),
  backgroundColor: z.string(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  imageAssetId: assetRefSchema,
  /** פרומפט מומלץ לתמונת הרקע — placeholder בלבד, המשתמש מייצר בעצמו */
  imagePrompt: z.string().default(''),
  /** כהות שכבת הכיסוי מעל תמונת רקע — שומרת על קריאות הכותרת */
  overlayOpacity: z.number().min(0).max(1),
  height: z.enum(['compact', 'medium', 'tall', 'screen']),
  alignment: z.enum(['start', 'center', 'end']),
  fullBleed: z.boolean(),
  button: buttonSchema,
});

export type HeroContent = z.infer<typeof heroContentSchema>;

export const createHeroContent = (overrides: Partial<HeroContent> = {}): HeroContent => ({
  variant: 'centered',
  title: 'כותרת הלומדה',
  subtitle: 'כותרת משנה קצרה שמסבירה על מה הלומדה',
  intro: '',
  backgroundType: 'theme',
  backgroundColor: '#2563eb',
  gradientFrom: '#2563eb',
  gradientTo: '#7c3aed',
  imageAssetId: '',
  imagePrompt: '',
  overlayOpacity: 0.45,
  height: 'medium',
  alignment: 'center',
  fullBleed: true,
  button: createButton(),
  ...overrides,
});

export const heroAssetIds = (content: HeroContent): string[] =>
  collectAssetIds(content.backgroundType === 'image' ? content.imageAssetId : undefined);
