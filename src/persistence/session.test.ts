import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCourse } from '@/model/factory';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { useSaveStore } from '@/state/saveStore';
import { cancelPendingSave } from './autosave';
import { listProjects, resetDbConnection, saveProject } from './db';
import { buildProjectFile } from './projectFile';
import { closeToWelcome, forceCloseToWelcome, openStoredProject } from './session';

/**
 * החזרה לדף הבית מתוך העורך (סעיף "חזרה הביתה").
 *
 * מה שנבדק הוא ההתנהגות שמונעת איבוד עבודה: closeToWelcome שומר קודם, ורק
 * אם השמירה הצליחה מאפס את הלומדה. אחרת נשארים בעורך, כדי שהקורא (TopBar)
 * יוכל לבקש אישור לפני שמוותרים על שינויים.
 */

beforeEach(() => {
  resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
  cancelPendingSave();

  useCourseStore.setState({ course: null });
  useAssetStore.setState({ assets: [], urls: {} });
  useSaveStore.getState().reset();
  useEditorStore.getState().reset();
});

describe('חזרה לדף הבית', () => {
  it('שומר את הלומדה ואז מאפס — היא תחזור כ"המשך מהמקום שבו הפסקת"', async () => {
    useCourseStore.setState({ course: createCourse({ title: 'עבודה בתהליך' }) });

    expect(await closeToWelcome()).toBe(true);

    // מסך הפתיחה חוזר כי הלומדה התאפסה
    expect(useCourseStore.getState().course).toBeNull();
    // אבל היא נשמרה קודם, ולכן קיימת באחסון
    expect((await listProjects())[0].title).toBe('עבודה בתהליך');
  });

  it('כשאין לומדה טעונה — מחזיר true בלי לעשות דבר', async () => {
    expect(await closeToWelcome()).toBe(true);
    expect(useCourseStore.getState().course).toBeNull();
  });

  it('כשהשמירה נכשלת — נשארים בעורך, הלומדה לא מתאפסת', async () => {
    const course = createCourse({ title: 'שינויים שלא נשמרו' });
    useCourseStore.setState({ course });

    // דפדפן בגלישה פרטית: פתיחת בסיס הנתונים נכשלת
    resetDbConnection();
    globalThis.indexedDB = {
      open: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    } as unknown as IDBFactory;

    expect(await closeToWelcome()).toBe(false);
    // עדיין בעורך — לא איבדנו את העבודה בשקט
    expect(useCourseStore.getState().course).toBe(course);
  });

  it('forceCloseToWelcome מאפס מיד בלי לשמור', async () => {
    useCourseStore.setState({ course: createCourse({ title: 'לא יישמר' }) });

    forceCloseToWelcome();

    expect(useCourseStore.getState().course).toBeNull();
    expect(await listProjects()).toHaveLength(0);
  });
});

/**
 * שחזור לומדה שמורה מ-IndexedDB עובר אותו שער אימות כמו ייבוא קובץ — אבל
 * best-effort: תקינות שבורה מזהירה ולא נועלת את המשתמשת מחוץ לעבודתה השמורה.
 */
describe('שחזור לומדה שמורה', () => {
  it('לומדה תקינה נטענת רגיל, בלי אזהרה', async () => {
    const course = createCourse({ title: 'תקין' });
    await saveProject(buildProjectFile(course, []));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await openStoredProject(course.id);

    expect(result.ok).toBe(true);
    expect(useCourseStore.getState().course?.id).toBe(course.id);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('לומדה עם מזהה כפול נטענת best-effort עם אזהרה — לא נחסמת', async () => {
    const course = createCourse({ title: 'מזהה כפול' });
    // הפרק מקבל את מזהה הלומדה — כפילות ש-findDuplicateIds תופס והסכמה לא
    course.chapters[0].id = course.id;
    await saveProject(buildProjectFile(course, []));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = await openStoredProject(course.id);

    expect(result.ok).toBe(true);
    // נטענה בכל זאת — עדיף לומדה עם בעיה על פני משתמשת שנעולה מעבודתה
    expect(useCourseStore.getState().course?.id).toBe(course.id);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('פרויקט שאינו קיים מחזיר שגיאה', async () => {
    const result = await openStoredProject('course-nonexistent');
    expect(result.ok).toBe(false);
  });
});
