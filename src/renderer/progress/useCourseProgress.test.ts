import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCourseProgress } from './useCourseProgress';

/**
 * מעקב ההתקדמות חי ב-localStorage וגדור ב-enabled. הבדיקות מוודאות שהוא
 * שומר, מחדש, מדווח ציון, ומשדר את אירוע `lc:progress` שהמתאם של SCORM
 * מקשיב לו — ושכשהמעקב כבוי הוא אינו נוגע באחסון.
 */

afterEach(() => {
  window.localStorage.clear();
  delete (window as { __LC_RESUME__?: unknown }).__LC_RESUME__;
  vi.restoreAllMocks();
});

const CHAPTERS = ['ch-a', 'ch-b', 'ch-c'];

describe('useCourseProgress', () => {
  it('שומר ומחדש את מיקום הפרק כשהמעקב פעיל', () => {
    const first = renderHook(() =>
      useCourseProgress('course-1', { enabled: true, totalQuizzes: 0 }),
    );
    act(() => first.result.current.setChapterIndex(2));
    expect(window.localStorage.getItem('lc-progress:course-1')).toContain('"chapterIndex":2');

    // רכיב חדש (טעינה מחדש) מחדש מהמיקום השמור
    const second = renderHook(() =>
      useCourseProgress('course-1', { enabled: true, totalQuizzes: 0 }),
    );
    expect(second.result.current.chapterIndex).toBe(2);
  });

  it('אינו נוגע באחסון כשהמעקב כבוי', () => {
    const { result } = renderHook(() =>
      useCourseProgress('course-2', { enabled: false, totalQuizzes: 0 }),
    );
    act(() => result.current.setChapterIndex(3));
    expect(window.localStorage.getItem('lc-progress:course-2')).toBeNull();
    // המצב עדיין עובד כזיכרון זמני
    expect(result.current.chapterIndex).toBe(3);
  });

  it('סופר תשובות נכונות ומעדכן לפי הניסיון האחרון', () => {
    const { result } = renderHook(() =>
      useCourseProgress('course-3', { enabled: true, totalQuizzes: 2 }),
    );
    act(() => result.current.reportQuiz('q1', false));
    act(() => result.current.reportQuiz('q2', true));
    expect(result.current.correctCount).toBe(1);
    expect(result.current.answeredCount).toBe(2);

    // ניסיון חוזר על q1 מעדכן את התוצאה
    act(() => result.current.reportQuiz('q1', true));
    expect(result.current.correctCount).toBe(2);
  });

  it('משדר את אירוע lc:progress עם מצב ההשלמה והציון', () => {
    const events: CustomEvent[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent);
    window.addEventListener('lc:progress', listener);

    const { result } = renderHook(() =>
      useCourseProgress('course-4', { enabled: true, totalQuizzes: 2 }),
    );
    act(() => result.current.reportQuiz('q1', true));
    act(() => result.current.setCompleted(true));

    window.removeEventListener('lc:progress', listener);

    const last = events.at(-1);
    expect(last?.detail).toMatchObject({ completed: true, correct: 1, total: 2, score: 50 });
  });

  it('reset מנקה את האחסון ואת המצב', () => {
    const { result } = renderHook(() =>
      useCourseProgress('course-5', { enabled: true, totalQuizzes: 1 }),
    );
    act(() => {
      result.current.setChapterIndex(1);
      result.current.reportQuiz('q1', true);
      result.current.setCompleted(true);
    });
    act(() => result.current.reset());

    expect(result.current.chapterIndex).toBe(0);
    expect(result.current.correctCount).toBe(0);
    expect(result.current.completed).toBe(false);
    expect(window.localStorage.getItem('lc-progress:course-5')).toContain('"completed":false');
  });

  it('שומר ומחדש את מצב הבלוקים האינטראקטיביים', () => {
    const options = { enabled: true, totalQuizzes: 0, chapterIds: CHAPTERS };
    const first = renderHook(() => useCourseProgress('course-6', options));
    act(() => first.result.current.setBlockState('block-1', () => ['item-1']));
    act(() =>
      first.result.current.setBlockState('block-1', (prev) => [...(prev as string[]), 'item-2']),
    );

    const second = renderHook(() => useCourseProgress('course-6', options));
    expect(second.result.current.blockState['block-1']).toEqual(['item-1', 'item-2']);
  });

  it('מסמן פרק כהושלם כשמתקדמים ממנו, ואת כולם בסיום הלומדה', () => {
    const { result } = renderHook(() =>
      useCourseProgress('course-7', { enabled: true, totalQuizzes: 0, chapterIds: CHAPTERS }),
    );
    expect(result.current.visited).toEqual(['ch-a']);

    act(() => result.current.setChapterIndex(1));
    expect(result.current.doneChapters).toEqual(['ch-a']);
    expect(result.current.visited).toEqual(['ch-a', 'ch-b']);

    // חזרה אחורה אינה משלימה את הפרק שממנו חזרו, ואינה מבטלת השלמה קודמת
    act(() => result.current.setChapterIndex(0));
    expect(result.current.doneChapters).toEqual(['ch-a']);

    act(() => result.current.setCompleted(true));
    expect(result.current.doneChapters).toEqual(['ch-a', 'ch-b', 'ch-c']);
  });

  it('חוזר לפרק לפי המזהה שלו גם אם סדר הפרקים השתנה', () => {
    const first = renderHook(() =>
      useCourseProgress('course-8', { enabled: true, totalQuizzes: 0, chapterIds: CHAPTERS }),
    );
    act(() => first.result.current.setChapterIndex(1));

    // המחבר הוסיף פרק בהתחלה ופרסם מחדש: ch-b עבר מאינדקס 1 ל-2
    const second = renderHook(() =>
      useCourseProgress('course-8', {
        enabled: true,
        totalQuizzes: 0,
        chapterIds: ['ch-new', 'ch-a', 'ch-b', 'ch-c'],
      }),
    );
    expect(second.result.current.chapterIndex).toBe(2);
  });

  it('קורא רשומה מגרסה 1 (בלי השדות החדשים) בלי לאבד אותה', () => {
    window.localStorage.setItem(
      'lc-progress:course-9',
      JSON.stringify({ chapterIndex: 1, quizResults: { q1: true }, completed: false }),
    );
    const { result } = renderHook(() =>
      useCourseProgress('course-9', { enabled: true, totalQuizzes: 1, chapterIds: CHAPTERS }),
    );
    expect(result.current.chapterIndex).toBe(1);
    expect(result.current.correctCount).toBe(1);
    expect(result.current.blockState).toEqual({});
  });

  it('רשומה פגומה באחסון אינה מפילה את הלומדה', () => {
    window.localStorage.setItem(
      'lc-progress:course-10',
      JSON.stringify({ chapterIndex: 'x', quizResults: [1], blockState: 'nope', visited: 5 }),
    );
    const { result } = renderHook(() =>
      useCourseProgress('course-10', { enabled: true, totalQuizzes: 0, chapterIds: CHAPTERS }),
    );
    expect(result.current.chapterIndex).toBe(0);
    expect(result.current.blockState).toEqual({});
    expect(result.current.visited).toEqual(['ch-a']);
  });

  it('מצב שהוזרק מה-LMS גובר על האחסון המקומי', () => {
    window.localStorage.setItem(
      'lc-progress:course-11',
      JSON.stringify({ chapterIndex: 2, quizResults: { q1: true }, completed: true }),
    );
    // הפעלה ב-LMS של לומד אחר, שעדיין לא התחיל: אובייקט ריק
    (window as { __LC_RESUME__?: unknown }).__LC_RESUME__ = {};
    const fresh = renderHook(() =>
      useCourseProgress('course-11', { enabled: true, totalQuizzes: 1, chapterIds: CHAPTERS }),
    );
    expect(fresh.result.current.chapterIndex).toBe(0);
    expect(fresh.result.current.completed).toBe(false);
    fresh.unmount();

    (window as { __LC_RESUME__?: unknown }).__LC_RESUME__ = {
      chapterId: 'ch-b',
      blockState: { 'block-1': ['item-1'] },
    };
    const resumed = renderHook(() =>
      useCourseProgress('course-11', { enabled: true, totalQuizzes: 1, chapterIds: CHAPTERS }),
    );
    expect(resumed.result.current.chapterIndex).toBe(1);
    expect(resumed.result.current.blockState['block-1']).toEqual(['item-1']);
  });

  it('משדר ב-lc:progress גם את המיקום ואת המצב המלא לשמירה ב-LMS', () => {
    const events: CustomEvent[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent);
    window.addEventListener('lc:progress', listener);

    const { result } = renderHook(() =>
      useCourseProgress('course-12', { enabled: true, totalQuizzes: 0, chapterIds: CHAPTERS }),
    );
    act(() => result.current.setChapterIndex(1));
    window.removeEventListener('lc:progress', listener);

    const last = events.at(-1);
    expect(last?.detail.location).toBe('1');
    expect(last?.detail.state).toMatchObject({ chapterId: 'ch-b', doneChapters: ['ch-a'] });
  });
});
