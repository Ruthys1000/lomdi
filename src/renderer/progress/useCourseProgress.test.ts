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
  vi.restoreAllMocks();
});

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
});
