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
 * מחשב. אם האחסון חסום — הרשימה פשוט לא מוצגת, ומסך הפתיחה נשאר שמיש.
 */

export interface RecentProjectsState {
  /** הלומדה שנפתחה לאחרונה, לפס הפעולה העליון */
  featured: ProjectSummary | null;
  /** כל השאר, לרשימה שמתחת */
  rest: ProjectSummary[];
  error: string | null;
  open: (id: string) => Promise<void>;
  remove: (project: ProjectSummary) => Promise<void>;
}

export function useRecentProjects(onOpened: () => void): RecentProjectsState {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [lastId, setLastId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const open = useCallback(
    async (id: string) => {
      const result = await openStoredProject(id);
      if (result.ok) onOpened();
      else setError(result.errors[0]);
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

  const featured = projects.find((project) => project.id === lastId) ?? projects[0] ?? null;
  const rest = featured ? projects.filter((project) => project.id !== featured.id) : [];

  return { featured, rest, error, open, remove };
}
