import { z } from 'zod';
import { createId } from '@/model/ids';

/**
 * שאלת תרגול מקומית. אין דיווח ציונים ל-Moodle ב-POC (סעיף 7.8), אבל
 * המבנה מאפשר להוסיף זאת בעתיד בלי לשנות את התוכן הקיים.
 */
export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean(),
});
export type QuizOption = z.infer<typeof quizOptionSchema>;

export const quizContentSchema = z.object({
  question: z.string(),
  hint: z.string(),
  options: z.array(quizOptionSchema),
  feedbackCorrect: z.string(),
  feedbackIncorrect: z.string(),
  shuffle: z.boolean(),
  allowRetry: z.boolean(),
  showSolution: z.boolean(),
  labels: z.object({
    submit: z.string(),
    retry: z.string(),
    solution: z.string(),
  }),
});

export type QuizContent = z.infer<typeof quizContentSchema>;

export const createQuizOption = (overrides: Partial<QuizOption> = {}): QuizOption => ({
  id: createId('option'),
  text: '',
  correct: false,
  ...overrides,
});

export const createQuizContent = (overrides: Partial<QuizContent> = {}): QuizContent => ({
  question: 'מה נכון מבין האפשרויות הבאות?',
  hint: '',
  options: [
    createQuizOption({ text: 'תשובה ראשונה', correct: true }),
    createQuizOption({ text: 'תשובה שנייה' }),
    createQuizOption({ text: 'תשובה שלישית' }),
  ],
  feedbackCorrect: 'נכון מאוד.',
  feedbackIncorrect: 'לא מדויק. נסו שוב.',
  shuffle: false,
  allowRetry: true,
  showSolution: true,
  labels: { submit: 'בדיקה', retry: 'ניסיון נוסף', solution: 'הצגת הפתרון' },
  ...overrides,
});

export const quizAssetIds = (): string[] => [];

/**
 * שאלה תקינה היא כזו שיש בה בדיוק תשובה נכונה אחת ולפחות שתי אפשרויות.
 * הבדיקה הזו משמשת גם את פאנל ההגדרות, כדי להזהיר את העורך בזמן אמת
 * במקום להשאיר שאלה שבורה בלומדה.
 */
export function quizIssues(content: QuizContent): string[] {
  const issues: string[] = [];
  const correct = content.options.filter((option) => option.correct);

  if (content.options.length < 2) issues.push('נדרשות לפחות שתי אפשרויות תשובה.');
  if (correct.length === 0) issues.push('לא סומנה תשובה נכונה.');
  if (correct.length > 1) issues.push('סומנה יותר מתשובה נכונה אחת.');
  if (content.options.some((option) => !option.text.trim())) {
    issues.push('יש אפשרות תשובה ריקה.');
  }
  if (!content.question.trim()) issues.push('לא הוזן נוסח שאלה.');

  return issues;
}
