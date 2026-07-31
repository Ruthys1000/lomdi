import { createContext, useContext } from 'react';

/**
 * ההקשר שמעביר דיווח תוצאת-שאלה מהבלוק העמוק אל מנגנון ההתקדמות בשורש.
 *
 * שאלת הבחירה יושבת עמוק בעץ, ו-`CourseRenderer` מספק כאן `reportQuiz`.
 * ברירת המחדל היא no-op, כדי ששאלה מחוץ ל-Provider (למשל בבדיקה) לא תיפול.
 */
interface ProgressContextValue {
  reportQuiz: (blockId: string, correct: boolean) => void;
}

export const ProgressContext = createContext<ProgressContextValue>({ reportQuiz: () => {} });

export function useQuizReporter(): ProgressContextValue['reportQuiz'] {
  return useContext(ProgressContext).reportQuiz;
}
