import { createContext, useCallback, useContext, useState } from 'react';

/**
 * ההקשר שמחבר בלוקים עמוקים בעץ אל מנגנון ההתקדמות בשורש.
 *
 * `CourseRenderer` מספק כאן `reportQuiz` ואת מאגר מצב הבלוקים. ברירת המחדל
 * היא no-op בלי מאגר, כדי שבלוק מחוץ ל-Provider (בדיקה) או בקנבס העריכה
 * פשוט יחזיק את המצב שלו מקומית, כמו לפני שהמאגר נוסף.
 */
interface ProgressContextValue {
  reportQuiz: (blockId: string, correct: boolean) => void;
  /** מצב הבלוקים האינטראקטיביים, לפי מזהה בלוק. חסר = אין מאגר משותף */
  blockState?: Record<string, unknown>;
  setBlockState?: (blockId: string, update: (previous: unknown) => unknown) => void;
}

export const ProgressContext = createContext<ProgressContextValue>({ reportQuiz: () => {} });

export function useQuizReporter(): ProgressContextValue['reportQuiz'] {
  return useContext(ProgressContext).reportQuiz;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * הערך השמור הגיע מ-`localStorage` או מה-LMS, ולכן אינו מובטח: ממזגים אותו
 * על ברירת המחדל רק כשהצורה תואמת (אובייקט על אובייקט, מערך על מערך), כדי
 * ששדה שנוסף לבלוק אחרי שהלומד התחיל לא יחזור כ-`undefined`.
 */
function restore<T>(stored: unknown, initial: T): T {
  if (stored === undefined || stored === null) return initial;
  if (Array.isArray(initial)) return Array.isArray(stored) ? (stored as T) : initial;
  if (isPlainObject(initial)) return isPlainObject(stored) ? { ...initial, ...stored } : initial;
  return typeof stored === typeof initial ? (stored as T) : initial;
}

type Update<T> = T | ((previous: T) => T);

/**
 * `useState` לבלוק אינטראקטיבי, שהמצב שלו שורד מעבר פרק ורענון.
 *
 * במצב פרקים הבלוקים מתמונטים מחדש בכל מעבר, ולכן `useState` רגיל מאפס את
 * תשובות הלומד כשהוא חוזר לפרק. כאן המצב נשמר במאגר של `useCourseProgress`
 * לפי מזהה הבלוק. הערך חייב להיות בר-המרה ל-JSON (מערך ולא `Set`).
 */
export function useBlockState<T>(blockId: string, initial: T): [T, (update: Update<T>) => void] {
  const { blockState, setBlockState } = useContext(ProgressContext);
  const [local, setLocal] = useState<T>(initial);

  const shared = blockState !== undefined && setBlockState !== undefined;
  const value = shared ? restore(blockState[blockId], initial) : local;

  const set = useCallback(
    (update: Update<T>) => {
      const resolve = (previous: T): T =>
        typeof update === 'function' ? (update as (previous: T) => T)(previous) : update;
      if (setBlockState) setBlockState(blockId, (stored) => resolve(restore(stored, initial)));
      else setLocal(resolve);
    },
    // `initial` הוא ליטרל חדש בכל רינדור; ערכו קבוע לכל חיי הבלוק
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blockId, setBlockState],
  );

  return [value, set];
}
