import { useCallback, useEffect, useState } from 'react';
import {
  deleteProject,
  getLastProjectId,
  listProjects,
  type ProjectSummary,
} from '@/persistence/db';
import { openStoredProject } from '@/persistence/session';

/**
 * טעינת הלומדות השמורות למסך הפתיחה.
 *
 * ה-hook יושב בקובץ נפרד מהרכיבים כדי ש-`RecentProjects.tsx` ייצא רכיבים
 * בלבד — קובץ שמייצא גם רכיב וגם לא-רכיב שובר את ה-Fast Refresh של Vite,
 * וזה נאכף ב-lint.
 *
 * נטען מ-IndexedDB ולא מהזיכרון, ולכן שורד רענון, סגירת לשונית וכיבוי
 * מחשב. אם האחסון חסום — מסך הפתיחה נשאר שמיש (אפשר ליצור ולייבא), אבל
 * ה-`error` מוצג: משתמשת שהעבודה שלה לא מופיעה חייבת לדעת שזו תקלת אחסון
 * ולא לומדה שנעלמה.
 */

export interface RecentProjectsState {
  /**
   * כל הלומדות השמורות, האחרונה-שנפתחה ראשונה.
   *
   * רשימה אחת ולא פיצול ל"אחרונה" ו"שאר": הנחיתה היא AI-first ואינה מציעה
   * המשך עבודה, ולכן אין יעד נפרד ללומדה האחרונה. המיון נשאר כי הוא מקצר
   * את החיפוש בתוך המגירה.
   */
  projects: ProjectSummary[];
  error: string | null;
  /** הלומדה שנפתחת ברגע זה — פתיחה עם נכסים אינה מיידית */
  openingId: string | null;
  open: (id: string) => Promise<void>;
  remove: (project: ProjectSummary) => Promise<void>;
}

export function useRecentProjects(onOpened: () => void): RecentProjectsState {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [lastId, setLastId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // getLastProjectId ולא projects[0]: הרשימה ממוינת לפי זמן *שמירה*,
    // והלומדה שנפתחה לאחרונה אינה בהכרח זו שנשמרה אחרונה. עד עכשיו
    // הפונקציה נכתבה ומעולם לא נקראה — הערך היה יושב ב-IndexedDB לחינם.
    Promise.all([listProjects(), getLastProjectId()])
      .then(([list, id]) => {
        if (!active) return;
        setProjects(list);
        setLastId(id);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'טעינת הפרויקטים נכשלה.');
      });

    return () => {
      active = false;
    };
  }, []);

  // הפתיחה קוראת נכסים מ-IndexedDB ולכן אורכת זמן מוחשי בפרויקט עם תמונות.
  // בלי `openingId` הלחיצה נראית כאילו לא נרשמה, והמשתמש לוחץ שוב.
  // בהצלחה הרכיב מתפרק (העורך מחליף את מסך הפתיחה), ולכן האיפוס בכשל בלבד.
  const open = useCallback(
    async (id: string) => {
      setOpeningId(id);
      setError(null);

      const result = await openStoredProject(id);
      if (result.ok) {
        onOpened();
        return;
      }

      setOpeningId(null);
      setError(result.errors[0]);
    },
    [onOpened],
  );

  const remove = useCallback(async (project: ProjectSummary) => {
    try {
      await deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'מחיקת הפרויקט נכשלה.');
    }
  }, []);

  // האחרונה-שנפתחה עולה לראש הרשימה. `listProjects` ממוינת לפי זמן *שמירה*,
  // וזו לא בהכרח אותה לומדה
  const lastOpened = projects.find((project) => project.id === lastId);
  const ordered = lastOpened
    ? [lastOpened, ...projects.filter((project) => project.id !== lastOpened.id)]
    : projects;

  return { projects: ordered, error, openingId, open, remove };
}
