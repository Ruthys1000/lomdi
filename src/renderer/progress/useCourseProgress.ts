import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * מעקב התקדמות של הלומד — חי כולו ברנדרר, עם `localStorage` בלבד.
 *
 * למה כאן ולא ב-store: הרנדרר משותף לעורך ולתוצר, וקוד העורך אסור בחבילת
 * הלומדה (מוסכמה 1). אחסון מקומי הוא API של הדפדפן ולכן מותר, בניגוד
 * ל-IndexedDB שנבדק ונאסר ב-`runtimeBundle.test.ts`.
 *
 * הכול מגודר ב-`enabled`: פעיל רק בתוצר ובתצוגה המקדימה (`!isEditing`)
 * וכשהמחבר השאיר את המעקב דלוק. `file://` מרשה `localStorage` ברוב
 * הדפדפנים, אך לא בכולם — ולכן כל גישה עטופה ב-try/catch ונכשלת בשקט.
 */

interface StoredProgress {
  chapterIndex: number;
  quizResults: Record<string, boolean>;
  completed: boolean;
}

const EMPTY: StoredProgress = { chapterIndex: 0, quizResults: {}, completed: false };

function readStore(key: string): Partial<StoredProgress> | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<StoredProgress>) : null;
  } catch {
    return null;
  }
}

function writeStore(key: string, value: StoredProgress): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אחסון חסום (גלישה פרטית, מכסה) — המעקב פשוט לא נשמר בין טעינות
  }
}

export interface CourseProgress {
  chapterIndex: number;
  setChapterIndex: (index: number) => void;
  reportQuiz: (blockId: string, correct: boolean) => void;
  completed: boolean;
  setCompleted: (value: boolean) => void;
  reset: () => void;
  /** מספר השאלות שנענו נכון */
  correctCount: number;
  /** מספר השאלות שנענו בכלל (נכון או לא) */
  answeredCount: number;
}

export function useCourseProgress(
  courseId: string,
  options: { enabled: boolean; totalQuizzes: number },
): CourseProgress {
  const { enabled, totalQuizzes } = options;
  const key = `lc-progress:${courseId}`;

  // הקריאה הראשונית מהאחסון קורית פעם אחת ב-initializer, ורק כשהמעקב פעיל
  const [chapterIndex, setChapterIndexState] = useState(
    () => (enabled ? (readStore(key)?.chapterIndex ?? 0) : 0),
  );
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>(
    () => (enabled ? (readStore(key)?.quizResults ?? {}) : {}),
  );
  const [completed, setCompletedState] = useState(
    () => (enabled ? (readStore(key)?.completed ?? false) : false),
  );

  // שמירה בכל שינוי — רק כשהמעקב פעיל
  useEffect(() => {
    if (!enabled) return;
    writeStore(key, { chapterIndex, quizResults, completed });
  }, [enabled, key, chapterIndex, quizResults, completed]);

  const correctCount = useMemo(
    () => Object.values(quizResults).filter(Boolean).length,
    [quizResults],
  );
  const answeredCount = Object.keys(quizResults).length;

  // שידור מצב ההתקדמות ל-window. אין לרנדרר תלות ב-SCORM — מתאם חיצוני
  // (בחבילת ה-SCORM בלבד) מקשיב לאירוע הזה ומדווח ל-LMS.
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const score = totalQuizzes > 0 ? Math.round((correctCount / totalQuizzes) * 100) : null;
    window.dispatchEvent(
      new CustomEvent('lc:progress', {
        detail: { completed, correct: correctCount, total: totalQuizzes, score },
      }),
    );
  }, [enabled, completed, correctCount, totalQuizzes]);

  const setChapterIndex = useCallback((index: number) => setChapterIndexState(index), []);

  const reportQuiz = useCallback((blockId: string, correct: boolean) => {
    setQuizResults((prev) => (prev[blockId] === correct ? prev : { ...prev, [blockId]: correct }));
  }, []);

  const setCompleted = useCallback((value: boolean) => setCompletedState(value), []);

  const reset = useCallback(() => {
    setChapterIndexState(0);
    setQuizResults({});
    setCompletedState(false);
    if (enabled) writeStore(key, EMPTY);
  }, [enabled, key]);

  return {
    chapterIndex,
    setChapterIndex,
    reportQuiz,
    completed,
    setCompleted,
    reset,
    correctCount,
    answeredCount,
  };
}
