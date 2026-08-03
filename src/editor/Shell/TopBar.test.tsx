import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCourse } from '@/model/factory';
import { courseHistory, useCourseStore } from '@/state/courseStore';
import { useToastStore } from '@/state/toastStore';
import { TopBar } from './TopBar';

/**
 * מה שנבדק כאן הוא *חומרת* ההודעות שהסרגל מייצר.
 *
 * ייבוא שהצליח עם הסתייגות (נכס חסר בארכיון) הוצג עד כה באותו אדום של כשל
 * מוחלט, כך שמשתמש חשב שהפרויקט לא נטען — למרות שהוא כן. ובמקביל, ביטול
 * וביצוע-מחדש הציפו את תור ההודעות בטוסט על כל לחיצה, והסתירו בדיוק את
 * ההודעות שאסור לפספס.
 */
const openProjectFile = vi.fn();

vi.mock('@/persistence/session', () => ({
  closeToWelcome: () => Promise.resolve(true),
  forceCloseToWelcome: () => {},
  downloadProjectFile: () => Promise.resolve(),
  openProjectFile: (file: Blob) => openProjectFile(file),
}));

/** חלון הקיבוץ של ההיסטוריה, בשפע */
const HISTORY_WINDOW = 500;

const toasts = () => useToastStore.getState().toasts;
const blocks = () => useCourseStore.getState().course!.chapters[0].blocks;

beforeEach(() => {
  openProjectFile.mockReset();
  useToastStore.setState({ toasts: [] });
  useCourseStore.getState().loadCourse(createCourse({ title: 'לומדה' }));
  courseHistory.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

async function importFile() {
  render(<TopBar />);

  // הקלט מוסתר בכוונה (נפתח מכפתור), ולכן נגשים אליו לפי הטיפוס
  const input = document.querySelector('input[type="file"]')!;
  const file = new File(['zip'], 'course.zip', { type: 'application/zip' });

  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });
}

describe('הסרגל העליון', () => {
  it('אזהרות ייבוא מוצגות כאזהרה — הפרויקט נטען, ומשהו בו דרש התאמה', async () => {
    openProjectFile.mockResolvedValue({
      ok: true,
      warnings: ['התמונה hero.jpg חסרה בארכיון'],
    });

    await importFile();

    const warning = toasts().find((item) => item.message.includes('hero.jpg'));
    expect(warning?.tone).toBe('warning');
    // ולצדה אישור שההצלחה אכן נרשמה
    expect(toasts().some((item) => item.tone === 'success')).toBe(true);
  });

  it('כשל ייבוא נשאר שגיאה', async () => {
    openProjectFile.mockResolvedValue({
      ok: false,
      errors: ['הקובץ אינו קובץ פרויקט תקין.'],
    });

    await importFile();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].tone).toBe('error');
  });

  it('ביטול וביצוע מחדש אינם מייצרים טוסט — הקנבס והכפתורים הם המשוב', () => {
    render(<TopBar />);

    const undo = screen.getByRole('button', { name: /ביטול/ });
    const redo = screen.getByRole('button', { name: /ביצוע מחדש/ });

    // בלומדה חדשה אין היסטוריה, ולכן שני הכפתורים מושבתים — וזה החיווי
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    // ההיסטוריה מקבצת שינויים בחלון של מילישניות, וטעינת הלומדה ב-beforeEach
    // פתחה חלון כזה. בלי לצאת ממנו ההוספה לא הייתה נרשמת, והכפתור היה נשאר
    // מושבת — כלומר הבדיקה הייתה "עוברת" בלי ללחוץ על כלום
    const chapterId = useCourseStore.getState().course!.chapters[0].id;
    vi.useFakeTimers();
    vi.advanceTimersByTime(HISTORY_WINDOW);
    act(() => {
      useCourseStore.getState().addBlock(chapterId, 'richText');
    });

    // עכשיו יש מה לבטל, ולכן הלחיצה אכן מגיעה למטפל
    expect(undo).toBeEnabled();
    fireEvent.click(undo);

    expect(blocks()).toHaveLength(0);
    expect(redo).toBeEnabled();
    fireEvent.click(redo);
    expect(blocks()).toHaveLength(1);

    expect(toasts()).toEqual([]);
  });
});
