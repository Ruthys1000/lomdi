import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { deleteProject, listProjects, type ProjectSummary } from '@/persistence/db';
import { openStoredProject } from '@/persistence/session';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/**
 * "המשך מהמקום שבו הפסקת" (סעיף 12).
 *
 * נטען מ-IndexedDB ולא מהזיכרון, ולכן שורד רענון, סגירת לשונית וכיבוי
 * מחשב. אם האחסון חסום — הרשימה פשוט לא מוצגת, ומסך הפתיחה נשאר שמיש.
 */
export function RecentProjects({ onOpened }: { onOpened: () => void }) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listProjects()
      .then((list) => {
        if (active) setProjects(list);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'טעינת הפרויקטים נכשלה.');
      });

    return () => {
      active = false;
    };
  }, []);

  const open = async (id: string) => {
    const result = await openStoredProject(id);
    if (result.ok) onOpened();
    else setError(result.errors[0]);
  };

  const remove = async (project: ProjectSummary) => {
    setPendingDelete(null);
    try {
      await deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'מחיקת הפרויקט נכשלה.');
    }
  };

  if (error) {
    return (
      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
        {error}
      </p>
    );
  }

  if (projects.length === 0) return null;

  return (
    // ה--mt-8 מרים את הכרטיס אל תוך פס הגרדיאנט של מסך הפתיחה. הכותרת
    // יושבת בתוך הכרטיס הלבן ולא מעליו, כדי שלא תיפול על רקע כחול
    <section className="-mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg" aria-labelledby="recent-heading">
      <h2
        id="recent-heading"
        className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900"
      >
        המשך מהמקום שבו הפסקת
      </h2>

      <ul className="divide-y divide-slate-100">
        {projects.map((project) => (
          <li key={project.id} className="group flex items-center gap-3 ps-4 pe-2">
            <button
              type="button"
              onClick={() => void open(project.id)}
              className="flex min-w-0 flex-1 items-center gap-3 py-3 text-start"
            >
              <Clock className="size-4 shrink-0 text-slate-300" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {project.title || 'לומדה ללא שם'}
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {project.chapterCount} פרקים · {project.blockCount} בלוקים ·{' '}
                  {formatSavedAt(project.savedAt)}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPendingDelete(project)}
              aria-label={`מחיקת ${project.title || 'הלומדה'}`}
              className="rounded-lg p-2 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="מחיקת הפרויקט מהמחשב"
        message={`"${pendingDelete?.title || 'לומדה ללא שם'}" יימחק מהאחסון של הדפדפן יחד עם הנכסים שלו. אם יש לכם קובץ ‎.course.zip‎ שמור, אפשר יהיה לפתוח אותו שוב.`}
        onConfirm={() => pendingDelete && void remove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

/**
 * תאריך בעברית.
 *
 * `he-IL` ולא ברירת המחדל של הדפדפן: הממשק עברי, ותאריך באנגלית באמצע
 * רשימה עברית קופץ לעין ומתערבב עם כיווניות הטקסט.
 */
function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  return sameDay
    ? `היום, ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}
