import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCourse } from '@/model/factory';
import { courseHistory, useCourseStore } from '@/state/courseStore';
import { useToastStore } from '@/state/toastStore';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

/**
 * מה שנבדק כאן הוא *מתי הקיצור מדבר*, ולא רק שהוא עובד.
 *
 * ביטול מוצלח משנה את הקנבס מול העיניים, ולכן טוסט על כל Ctrl+Z רק הציף את
 * התור והסתיר הודעות שאסור לפספס. אבל קיצור שלא עשה כלום ואינו מסביר למה
 * נראה כמו תקלה — ודווקא שם ההודעה נדרשת.
 *
 * ההיסטוריה מקבצת שינויים בחלון זמן (throttle לפי `Date.now`), והמצב הזה
 * משותף למודול לכל אורך הקובץ. לכן כל בדיקה מתחילה בשעון שקדימה בהרבה מזה
 * של קודמתה: בלי זה שינוי בבדיקה מאוחרת נבלע בחלון של בדיקה קודמת, ואז
 * הבדיקה "עוברת" מהסיבה הלא נכונה.
 */
const HISTORY_WINDOW = 500;
const TEST_CLOCK_GAP = 60_000;

let clock = Date.now();

function Harness() {
  useKeyboardShortcuts();
  return null;
}

const toasts = () => useToastStore.getState().toasts;
const messages = () => toasts().map((item) => item.message);
const blocks = () => useCourseStore.getState().course!.chapters[0].blocks;

function pressUndo(shift = false) {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: shift, bubbles: true }),
  );
}

/** שינוי שמייצר רשומת היסטוריה אחת, עם תנאי מוקדם מפורש */
function addBlock() {
  vi.advanceTimersByTime(HISTORY_WINDOW);
  useCourseStore.getState().addBlock(useCourseStore.getState().course!.chapters[0].id, 'richText');

  expect(blocks()).toHaveLength(1);
  expect(courseHistory.canUndo()).toBe(true);
}

beforeEach(() => {
  clock += TEST_CLOCK_GAP;
  vi.useFakeTimers({ now: clock });
  useToastStore.setState({ toasts: [] });
  useCourseStore.getState().loadCourse(createCourse({ title: 'לומדה' }));
  courseHistory.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('קיצורי הביטול והביצוע-מחדש', () => {
  it('ביטול מוצלח אינו מייצר טוסט', () => {
    render(<Harness />);
    addBlock();

    pressUndo();

    expect(blocks()).toHaveLength(0);
    expect(messages()).toEqual([]);
  });

  it('ביטול כשאין מה לבטל מסביר את עצמו', () => {
    render(<Harness />);
    expect(courseHistory.canUndo()).toBe(false);

    pressUndo();

    expect(messages()).toEqual(['אין פעולה לביטול']);
  });

  it('ביצוע מחדש כשאין מה לבצע מסביר את עצמו', () => {
    render(<Harness />);
    expect(courseHistory.canRedo()).toBe(false);

    pressUndo(true);

    expect(messages()).toEqual(['אין פעולה לביצוע מחדש']);
  });

  it('ביצוע מחדש אחרי ביטול אינו מייצר טוסט', () => {
    render(<Harness />);
    addBlock();
    courseHistory.undo();
    expect(courseHistory.canRedo()).toBe(true);

    pressUndo(true);

    expect(blocks()).toHaveLength(1);
    expect(messages()).toEqual([]);
  });

  it('כשהפוקוס בתוך שדה טקסט, הקיצור אינו נוגע בהיסטוריית המסמך', () => {
    render(<Harness />);
    const { container } = render(<input type="text" />);
    const input = container.querySelector('input')!;
    input.focus();

    // TipTap וכל שדה טקסט מנהלים היסטוריה משלהם; חטיפת Ctrl+Z כאן הייתה
    // מוחקת בלוק שלם במקום תו
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));

    expect(messages()).toEqual([]);
  });
});
