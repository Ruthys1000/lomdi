import { z } from 'zod';
import { createId } from '@/model/ids';

/**
 * בלוק צ׳ק-ליסט — פריטים ניתנים-לסימון. לב הפורמט "Checklist".
 *
 * טקסט פשוט לכל פריט + תיאור קצר אופציונלי (לא טקסט עשיר), כדי שהעריכה
 * בקנבס תישאר ישירה. הסימון עצמו אינטראקטיבי בתוצר ובתצוגה המקדימה (state
 * מקומי, לא נשמר), ומושבת בעורך כדי לא להתנגש בבחירת הבלוק.
 */
export const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const checklistContentSchema = z.object({
  items: z.array(checklistItemSchema),
  /** מציג אינדיקטור "X מתוך N הושלמו" מתחת לרשימה */
  showCount: z.boolean(),
});

export type ChecklistContent = z.infer<typeof checklistContentSchema>;

export const createChecklistItem = (overrides: Partial<ChecklistItem> = {}): ChecklistItem => ({
  id: createId('checklistItem'),
  text: 'פריט לבדיקה',
  description: '',
  ...overrides,
});

export const createChecklistContent = (
  overrides: Partial<ChecklistContent> = {},
): ChecklistContent => ({
  items: [
    createChecklistItem({ text: 'הפריט הראשון לבדיקה' }),
    createChecklistItem({ text: 'הפריט השני לבדיקה' }),
    createChecklistItem({ text: 'הפריט השלישי לבדיקה' }),
  ],
  showCount: true,
  ...overrides,
});

export const checklistAssetIds = (): string[] => [];
