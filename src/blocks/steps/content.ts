import { z } from 'zod';
import { createId } from '@/model/ids';

/**
 * בלוק שלבים — רצף ממוספר של פעולות לפי הסדר. לב הפורמט "Process".
 *
 * כותרת וטקסט פשוט לכל שלב (לא טקסט עשיר) — שלב הוא פעולה חדה, וכך העריכה
 * בקנבס נשארת ישירה בלי TipTap, בדיוק כמו בכרטיסים.
 */
export const stepSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
});
export type StepItem = z.infer<typeof stepSchema>;

/** וריאציית תצוגה. `.default` שומר על תאימות אחורה. */
export const stepsVariantSchema = z.enum(['numbered', 'arrow']).default('numbered');
export type StepsVariant = z.infer<typeof stepsVariantSchema>;

export const stepsContentSchema = z.object({
  variant: stepsVariantSchema,
  items: z.array(stepSchema),
});

export type StepsContent = z.infer<typeof stepsContentSchema>;

export const createStep = (overrides: Partial<StepItem> = {}): StepItem => ({
  id: createId('step'),
  title: 'כותרת השלב',
  text: 'מה עושים בשלב הזה, ומה התוצאה.',
  ...overrides,
});

export const createStepsContent = (overrides: Partial<StepsContent> = {}): StepsContent => ({
  variant: 'numbered',
  items: [
    createStep({ title: 'שלב ראשון' }),
    createStep({ title: 'שלב שני' }),
    createStep({ title: 'שלב שלישי' }),
  ],
  ...overrides,
});

export const stepsAssetIds = (): string[] => [];
