import { z } from 'zod';
import { createId } from '@/model/ids';
import { quizOptionSchema, createQuizOption, type QuizOption } from '../quiz/content';

/**
 * בלוק "בחן את עצמך" — סדרת שאלות עם ציון. לב הפורמט "Challenge".
 *
 * ממחזר את מודל האפשרויות של quiz (`quizOptionSchema`), אבל מוסיף ציון כולל
 * ומשוב מעבר/כישלון — וזה מה שמבדיל אותו מ-quiz בודד ונותן לו זהות של הערכה.
 */
export const challengeQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(quizOptionSchema),
  /** הסבר שנחשף אחרי הבדיקה, לכל שאלה */
  explanation: z.string(),
});
export type ChallengeQuestion = z.infer<typeof challengeQuestionSchema>;

export const challengeContentSchema = z.object({
  intro: z.string(),
  questions: z.array(challengeQuestionSchema),
  /** אחוז המעבר (0–100) */
  passScore: z.number().min(0).max(100),
  resultPass: z.string(),
  resultFail: z.string(),
});

export type ChallengeContent = z.infer<typeof challengeContentSchema>;

export const createChallengeQuestion = (
  overrides: Partial<ChallengeQuestion> = {},
): ChallengeQuestion => ({
  id: createId('challengeQuestion'),
  prompt: 'מה נכון מבין האפשרויות?',
  options: [
    createQuizOption({ text: 'תשובה נכונה', correct: true }),
    createQuizOption({ text: 'תשובה שגויה' }),
    createQuizOption({ text: 'תשובה שגויה נוספת' }),
  ],
  explanation: '',
  ...overrides,
});

export const createChallengeContent = (
  overrides: Partial<ChallengeContent> = {},
): ChallengeContent => ({
  intro: 'בחרו את התשובה הנכונה בכל שאלה.',
  questions: [createChallengeQuestion(), createChallengeQuestion()],
  passScore: 70,
  resultPass: 'כל הכבוד! עברתם את המבחן.',
  resultFail: 'כדאי לחזור על החומר ולנסות שוב.',
  ...overrides,
});

export const challengeAssetIds = (): string[] => [];

/** שאלה תקינה: לפחות שתי אפשרויות, בדיוק תשובה נכונה אחת, ונוסח שאלה */
function questionIssues(question: ChallengeQuestion, index: number): string[] {
  const issues: string[] = [];
  const correct = question.options.filter((option) => option.correct);
  const n = index + 1;
  if (!question.prompt.trim()) issues.push(`שאלה ${n}: לא הוזן נוסח.`);
  if (question.options.length < 2) issues.push(`שאלה ${n}: נדרשות לפחות שתי אפשרויות.`);
  if (correct.length === 0) issues.push(`שאלה ${n}: לא סומנה תשובה נכונה.`);
  if (correct.length > 1) issues.push(`שאלה ${n}: סומנה יותר מתשובה נכונה אחת.`);
  return issues;
}

export function challengeIssues(content: ChallengeContent): string[] {
  if (content.questions.length === 0) return ['אין שאלות במבחן.'];
  return content.questions.flatMap((question, index) => questionIssues(question, index));
}

/** תשובה נכונה של שאלה — ל-Renderer */
export const correctOptionId = (question: ChallengeQuestion): string | undefined =>
  question.options.find((option: QuizOption) => option.correct)?.id;
