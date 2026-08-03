import { z } from 'zod';
import { createId } from '@/model/ids';

/**
 * בלוק החלטה — נקודת בחירה בתרחיש. לב הפורמט "Scenario".
 *
 * בניגוד ל-quiz אין "תשובה נכונה" יחידה: כל אפשרות מובילה למשוב/השלכה משלה.
 * המטרה היא למידה מתוך התנסות, לא בדיקת ידע. ליניארי-לייט: הבחירה חושפת משוב
 * בתוך אותו בלוק, בלי הסתעפות לבלוקים אחרים.
 */
export const decisionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  /** המשוב/ההשלכה שנחשפים כשבוחרים באפשרות הזו */
  feedback: z.string(),
});
export type DecisionOption = z.infer<typeof decisionOptionSchema>;

export const decisionContentSchema = z.object({
  prompt: z.string(),
  options: z.array(decisionOptionSchema),
  /** מאפשר ללומד לנסות בחירה אחרת ולראות השלכה נוספת */
  allowReselect: z.boolean(),
});

export type DecisionContent = z.infer<typeof decisionContentSchema>;

export const createDecisionOption = (overrides: Partial<DecisionOption> = {}): DecisionOption => ({
  id: createId('decisionOption'),
  text: 'אפשרות בחירה',
  feedback: 'מה קורה כשבוחרים באפשרות הזו.',
  ...overrides,
});

export const createDecisionContent = (
  overrides: Partial<DecisionContent> = {},
): DecisionContent => ({
  prompt: 'מה הייתם עושים?',
  options: [
    createDecisionOption({ text: 'האפשרות הראשונה' }),
    createDecisionOption({ text: 'האפשרות השנייה' }),
    createDecisionOption({ text: 'האפשרות השלישית' }),
  ],
  allowReselect: true,
  ...overrides,
});

export const decisionAssetIds = (): string[] => [];
