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
 *
 * גרסה 2 של המצב השמור מוסיפה את מה שרצף למידה צריך: מצב הבלוקים
 * האינטראקטיביים (`blockState`), הפרקים שנפתחו (`visited`) והפרקים
 * שהושלמו (`doneChapters`). רשומה מגרסה 1 — בלי `v` — נקראת כמות שהיא,
 * והשדות החסרים מתמלאים בברירות מחדל.
 */

export const PROGRESS_VERSION = 2;

export interface StoredProgress {
  v: number;
  /** נשמר לצד `chapterId` לתאימות לאחור ולמקרה שהפרק נמחק */
  chapterIndex: number;
  /** מזהה ולא רק אינדקס — כדי שהוספת פרק לפני הנוכחי לא תזיז את הלומד */
  chapterId: string | null;
  visited: string[];
  doneChapters: string[];
  quizResults: Record<string, boolean>;
  /** מצב חופשי לכל בלוק אינטראקטיבי, לפי מזהה הבלוק. חייב להיות JSON */
  blockState: Record<string, unknown>;
  completed: boolean;
  updatedAt: number;
}

const emptyProgress = (): StoredProgress => ({
  v: PROGRESS_VERSION,
  chapterIndex: 0,
  chapterId: null,
  visited: [],
  doneChapters: [],
  quizResults: {},
  blockState: {},
  completed: false,
  updatedAt: 0,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/**
 * מנרמל ערך גולמי מהאחסון — שנכתב אולי בגרסה קודמת, או נערך ידנית — למבנה
 * מלא. כל שדה נבדק בנפרד, כדי שרשומה פגומה חלקית לא תפיל את הלומדה.
 */
export function normalizeProgress(input: unknown, chapterIds: string[]): StoredProgress {
  // רשומה חסרה או לא-אובייקט מטופלת כרשומה ריקה, כדי שגם לומד חדש יקבל
  // `chapterId` של הפרק הראשון
  const raw = isRecord(input) ? input : {};

  const quizResults: Record<string, boolean> = {};
  if (isRecord(raw.quizResults)) {
    for (const [id, value] of Object.entries(raw.quizResults)) {
      if (typeof value === 'boolean') quizResults[id] = value;
    }
  }

  const storedIndex =
    typeof raw.chapterIndex === 'number' && Number.isFinite(raw.chapterIndex)
      ? Math.max(0, Math.floor(raw.chapterIndex))
      : 0;
  const storedId = typeof raw.chapterId === 'string' ? raw.chapterId : null;
  // המזהה גובר על האינדקס: אם הפרק עדיין קיים, חוזרים אליו גם אם זז
  const idIndex = storedId ? chapterIds.indexOf(storedId) : -1;
  const chapterIndex = idIndex >= 0 ? idIndex : storedIndex;

  return {
    v: PROGRESS_VERSION,
    chapterIndex,
    chapterId: chapterIds[chapterIndex] ?? null,
    visited: stringList(raw.visited),
    doneChapters: stringList(raw.doneChapters),
    quizResults,
    blockState: isRecord(raw.blockState) ? raw.blockState : {},
    completed: raw.completed === true,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  };
}

function readStore(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
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

/**
 * מצב שהוזרק מבחוץ לפני עליית הלומדה — כיום רק מתאם ה-SCORM, שקורא את
 * `cmi.suspend_data` מה-LMS. כשהוא קיים הוא גובר על `localStorage`: ב-LMS
 * המשתמש מזוהה, ואילו האחסון המקומי משותף לכל מי שיושב מול אותו דפדפן.
 */
function readInjected(): unknown {
  if (typeof window === 'undefined') return undefined;
  return (window as { __LC_RESUME__?: unknown }).__LC_RESUME__;
}

const addUnique = (list: string[], id: string | null | undefined): string[] =>
  id && !list.includes(id) ? [...list, id] : list;

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
  /** מזהי הפרקים שהלומד פתח */
  visited: string[];
  /** מזהי הפרקים שהלומד השלים (התקדם מהם הלאה, או סיים את הלומדה) */
  doneChapters: string[];
  /** מצב הבלוקים האינטראקטיביים, לפי מזהה בלוק */
  blockState: Record<string, unknown>;
  setBlockState: (blockId: string, update: (previous: unknown) => unknown) => void;
}

export function useCourseProgress(
  courseId: string,
  options: { enabled: boolean; totalQuizzes: number; chapterIds?: string[] },
): CourseProgress {
  const { enabled, totalQuizzes } = options;
  const key = `lc-progress:${courseId}`;
  const chapterIdsKey = (options.chapterIds ?? []).join('|');
  const chapterIds = useMemo(() => (chapterIdsKey ? chapterIdsKey.split('|') : []), [chapterIdsKey]);

  // הקריאה מהאחסון קורית פעם אחת ב-initializer, ורק כשהמעקב פעיל
  const [state, setState] = useState<StoredProgress>(() => {
    if (!enabled) return emptyProgress();
    const injected = readInjected();
    const loaded = normalizeProgress(injected !== undefined ? injected : readStore(key), chapterIds);
    return { ...loaded, visited: addUnique(loaded.visited, loaded.chapterId) };
  });

  // שמירה בכל שינוי — רק כשהמעקב פעיל
  useEffect(() => {
    if (!enabled) return;
    writeStore(key, state);
  }, [enabled, key, state]);

  const correctCount = useMemo(
    () => Object.values(state.quizResults).filter(Boolean).length,
    [state.quizResults],
  );
  const answeredCount = Object.keys(state.quizResults).length;

  // שידור מצב ההתקדמות ל-window. אין לרנדרר תלות ב-SCORM — מתאם חיצוני
  // (בחבילת ה-SCORM בלבד) מקשיב לאירוע הזה ומדווח ל-LMS. `state` הוא המצב
  // המלא, שהמתאם שומר ב-`cmi.suspend_data` כדי שהלומד ימשיך מכל מכשיר.
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const score = totalQuizzes > 0 ? Math.round((correctCount / totalQuizzes) * 100) : null;
    window.dispatchEvent(
      new CustomEvent('lc:progress', {
        detail: {
          completed: state.completed,
          correct: correctCount,
          total: totalQuizzes,
          score,
          location: String(state.chapterIndex),
          state,
        },
      }),
    );
  }, [enabled, state, correctCount, totalQuizzes]);

  const update = useCallback((change: (previous: StoredProgress) => StoredProgress) => {
    setState((previous) => {
      const next = change(previous);
      return next === previous ? previous : { ...next, updatedAt: Date.now() };
    });
  }, []);

  const setChapterIndex = useCallback(
    (index: number) => {
      update((previous) => {
        if (index === previous.chapterIndex) return previous;
        const nextId = chapterIds[index] ?? null;
        return {
          ...previous,
          chapterIndex: index,
          chapterId: nextId,
          visited: addUnique(previous.visited, nextId),
          // התקדמות קדימה היא הסימן שהפרק הקודם הושלם; חזרה אחורה אינה מבטלת
          doneChapters:
            index > previous.chapterIndex
              ? addUnique(previous.doneChapters, chapterIds[previous.chapterIndex])
              : previous.doneChapters,
        };
      });
    },
    [update, chapterIds],
  );

  const reportQuiz = useCallback(
    (blockId: string, correct: boolean) => {
      update((previous) =>
        previous.quizResults[blockId] === correct
          ? previous
          : { ...previous, quizResults: { ...previous.quizResults, [blockId]: correct } },
      );
    },
    [update],
  );

  const setCompleted = useCallback(
    (value: boolean) => {
      update((previous) => {
        if (previous.completed === value) return previous;
        // סיום הלומדה משלים את כל הפרקים — כולל במצב גלילה, שאין בו מעברים
        const doneChapters = value
          ? chapterIds.reduce(addUnique, previous.doneChapters)
          : previous.doneChapters;
        return { ...previous, completed: value, doneChapters };
      });
    },
    [update, chapterIds],
  );

  const setBlockState = useCallback(
    (blockId: string, change: (previous: unknown) => unknown) => {
      update((previous) => {
        const current = previous.blockState[blockId];
        const next = change(current);
        return next === current
          ? previous
          : { ...previous, blockState: { ...previous.blockState, [blockId]: next } };
      });
    },
    [update],
  );

  const reset = useCallback(() => {
    const cleared = { ...emptyProgress(), chapterId: chapterIds[0] ?? null };
    setState({ ...cleared, visited: addUnique([], cleared.chapterId), updatedAt: Date.now() });
  }, [chapterIds]);

  return {
    chapterIndex: state.chapterIndex,
    setChapterIndex,
    reportQuiz,
    completed: state.completed,
    setCompleted,
    reset,
    correctCount,
    answeredCount,
    visited: state.visited,
    doneChapters: state.doneChapters,
    blockState: state.blockState,
    setBlockState,
  };
}
