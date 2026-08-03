import { z } from 'zod';

/**
 * בלוק "מסר מרכזי" — קופסה בולטת ל-takeaway, טיפ או אזהרה.
 *
 * במכוון טקסט פשוט ולא טקסט עשיר: callout הוא משפט-שניים חדים, לא פסקה.
 * זה גם חוסך את גרירת TipTap לעריכה בקנבס, בדיוק כמו הכותרת/טקסט בכרטיס.
 */
export const calloutVariantSchema = z
  .enum(['takeaway', 'info', 'success', 'warning'])
  .default('takeaway');
export type CalloutVariant = z.infer<typeof calloutVariantSchema>;

export const calloutContentSchema = z.object({
  variant: calloutVariantSchema,
  /** שם אייקון מ-lucide, או ריק להסתרה */
  icon: z.string(),
  title: z.string(),
  text: z.string(),
});

export type CalloutContent = z.infer<typeof calloutContentSchema>;

export const createCalloutContent = (overrides: Partial<CalloutContent> = {}): CalloutContent => ({
  variant: 'takeaway',
  icon: 'Lightbulb',
  title: 'המסר המרכזי',
  text: 'הנקודה החשובה ביותר שכדאי לקחת מהתוכן הזה.',
  ...overrides,
});

export const calloutAssetIds = (): string[] => [];
