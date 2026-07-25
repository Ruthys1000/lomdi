import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCourse } from '@/model/factory';
import { courseHistory, useCourseStore } from './courseStore';

/**
 * ההיסטוריה מקבצת שינויים בחלון זמן, ולכן הבדיקות מזייפות את השעון.
 * בלי זה כל הפעולות בבדיקה נופלות באותה מילישנייה ונרשמות כפעולה אחת,
 * והבדיקה הייתה מודדת את הטיימר במקום את ההתנהגות.
 */
const HISTORY_WINDOW = 500;

function advanceTime() {
  vi.advanceTimersByTime(HISTORY_WINDOW);
}

const history = () => useCourseStore.temporal.getState();
const currentCourse = () => useCourseStore.getState().course!;

describe('היסטוריית העריכה', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useCourseStore.getState().loadCourse(createCourse({ title: 'לומדה' }));

    history().clear();
  });

  it('מתחילה ריקה — אין מה לבטל בפרויקט חדש', () => {
    expect(history().pastStates).toHaveLength(0);
    expect(history().futureStates).toHaveLength(0);
  });

  it('מבטלת הוספת בלוק', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    useCourseStore.getState().addBlock(chapterId, 'richText');

    expect(currentCourse().chapters[0].blocks).toHaveLength(1);

    courseHistory.undo();
    expect(currentCourse().chapters[0].blocks).toHaveLength(0);
  });

  it('מבצעת מחדש אחרי ביטול', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    useCourseStore.getState().addBlock(chapterId, 'richText');

    courseHistory.undo();
    courseHistory.redo();

    expect(currentCourse().chapters[0].blocks).toHaveLength(1);
  });

  it('מבטלת מחיקת בלוק ומחזירה אותו עם אותו מזהה', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    const blockId = useCourseStore.getState().addBlock(chapterId, 'image');

    advanceTime();
    useCourseStore.getState().removeBlock(blockId!);
    expect(currentCourse().chapters[0].blocks).toHaveLength(0);

    courseHistory.undo();
    expect(currentCourse().chapters[0].blocks[0].id).toBe(blockId);
  });

  it('מבטלת מחיקת פרק על כל הבלוקים שבו', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    useCourseStore.getState().addBlock(chapterId, 'richText');
    advanceTime();
    useCourseStore.getState().addBlock(chapterId, 'image');

    advanceTime();
    useCourseStore.getState().removeChapter(chapterId);
    expect(currentCourse().chapters).toHaveLength(0);

    courseHistory.undo();
    expect(currentCourse().chapters[0].blocks).toHaveLength(2);
  });

  it('מבטלת שינוי סדר', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    const first = useCourseStore.getState().addBlock(chapterId, 'richText');
    advanceTime();
    useCourseStore.getState().addBlock(chapterId, 'image');

    advanceTime();
    useCourseStore.getState().moveBlockWithinChapter(chapterId, 0, 1);
    expect(currentCourse().chapters[0].blocks[1].id).toBe(first);

    courseHistory.undo();
    expect(currentCourse().chapters[0].blocks[0].id).toBe(first);
  });

  it('מבטלת שינוי הגדרה', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    const blockId = useCourseStore.getState().addBlock(chapterId, 'richText');

    advanceTime();
    useCourseStore.getState().updateBlockSettings(blockId!, { width: 'wide' });
    expect(currentCourse().chapters[0].blocks[0].settings.width).toBe('wide');

    courseHistory.undo();
    expect(currentCourse().chapters[0].blocks[0].settings.width).toBe('normal');
  });

  it('מקבצת שינויים רצופים לרשומה אחת, כדי שהקלדה לא תמלא את ההיסטוריה', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    const blockId = useCourseStore.getState().addBlock(chapterId, 'richText');

    const before = history().pastStates.length;

    // חמישה עדכונים באותו חלון זמן — כמו הקלדה של חמישה תווים
    for (let i = 0; i < 5; i++) {
      useCourseStore.getState().updateBlockContent(blockId!, { doc: { type: 'doc' }, maxWidth: 'normal' });
    }

    expect(history().pastStates.length - before).toBeLessThanOrEqual(1);
  });

  it('פעולה שאינה משנה דבר אינה מייצרת רשומת היסטוריה', () => {
    advanceTime();
    const before = history().pastStates.length;

    useCourseStore.getState().removeBlock('block-שאינו-קיים');
    advanceTime();
    useCourseStore.getState().moveChapter(0, 0);

    expect(history().pastStates.length).toBe(before);
  });

  it('טעינת פרויקט חדש מנקה את ההיסטוריה', () => {
    const chapterId = currentCourse().chapters[0].id;
    advanceTime();
    useCourseStore.getState().addBlock(chapterId, 'richText');
    expect(history().pastStates.length).toBeGreaterThan(0);

    useCourseStore.getState().loadCourse(createCourse({ title: 'פרויקט אחר' }));


    // אחרת undo היה מחזיר את המשתמש לפרויקט שכבר סגר
    expect(history().pastStates).toHaveLength(0);
    expect(currentCourse().title).toBe('פרויקט אחר');
  });

  it('מגבילה את ההיסטוריה ל-50 רשומות (סעיף 14)', () => {
    const chapterId = currentCourse().chapters[0].id;

    for (let i = 0; i < 60; i++) {
      advanceTime();
      useCourseStore.getState().addBlock(chapterId, 'divider');
    }

    expect(history().pastStates.length).toBeLessThanOrEqual(50);
  });
});
