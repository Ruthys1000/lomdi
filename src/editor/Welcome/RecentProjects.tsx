import { useState } from 'react';
import { ChevronDown, Loader2, Trash2 } from 'lucide-react';
import type { ProjectSummary } from '@/persistence/db';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/**
 * רשימת הלומדות השמורות, בתוך מגירת "הלומדות שלי".
 *
 * **הנחיתה היא AI-first ואינה מציעה "המשך מהמקום שבו הפסקת".** היו כאן שני
 * רכיבים — כרטיס לומדה אחרונה ורשימה — והכרטיס נמחק עם ההכרעה הזו: הדף
 * הראשי מציע יצירה מ-AI ובניית דף ריק, והעבודה השמורה נגישה מהמגירה בלבד.
 * המיון (האחרונה-שנפתחה ראשונה) נשאר, כי הוא עדיין מקצר את החיפוש במגירה.
 *
 * הנתונים מגיעים מ-`useRecentProjects`.
 */

/** כמה לומדות מוצגות לפני "עוד" — רשימה ארוכה דוחפת את שאר המסך מטה */
const COLLAPSED_COUNT = 4;

/** מקופלת מעבר ל-COLLAPSED_COUNT כדי לא לדחוף את המסך */
export function ProjectList({
  projects,
  openingId = null,
  onOpen,
  onRemove,
}: {
  projects: ProjectSummary[];
  /** הלומדה שנפתחת ברגע זה. פתיחה עם נכסים אינה מיידית */
  openingId?: string | null;
  onOpen: (id: string) => void;
  onRemove: (project: ProjectSummary) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null);

  if (projects.length === 0) return null;

  const visible = expanded ? projects : projects.slice(0, COLLAPSED_COUNT);
  const hidden = projects.length - visible.length;

  return (
    <section aria-label="הלומדות שלי">
      <ul className="overflow-hidden rounded-2xl border border-edge bg-panel">
        {visible.map((project) => {
          const opening = openingId === project.id;

          return (
          <li
            key={project.id}
            className="flex items-center gap-2 border-b border-edge ps-4 pe-2 last:border-b-0"
          >
            {/*
              נעול בזמן פתיחה, ולא רק בשורה שנלחצה: קריאת הנכסים מ-IndexedDB
              אורכת זמן, ולחיצה שנייה על לומדה אחרת באמצע הייתה מחליפה את
              הפרויקט שנטען באמצע הטעינה
            */}
            <button
              type="button"
              onClick={() => onOpen(project.id)}
              disabled={openingId !== null}
              aria-busy={opening}
              className="min-w-0 flex-1 py-3 text-start disabled:opacity-60"
            >
              <span className="block truncate text-sm font-semibold text-fg">
                {project.title || 'לומדה ללא שם'}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                {opening ? (
                  <>
                    <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden />
                    פותח…
                  </>
                ) : (
                  <>
                    {project.chapterCount} פרקים · {project.blockCount} בלוקים ·{' '}
                    {formatSavedAt(project.savedAt)}
                  </>
                )}
              </span>
            </button>

            {/*
              גלוי תמיד ולא ב-hover בלבד: כפתור שמופיע רק בריחוף אינו קיים
              במסך מגע, ומחיקת לומדה הייתה הופכת לפעולה שאי אפשר להגיע
              אליה מטאבלט
            */}
            <button
              type="button"
              onClick={() => setPendingDelete(project)}
              disabled={openingId !== null}
              aria-label={`מחיקת ${project.title || 'הלומדה'}`}
              title="מחיקה"
              className="rounded-lg p-2 text-fg-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
          );
        })}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-volt-ink transition hover:text-fg"
        >
          <ChevronDown className="size-4" aria-hidden />
          עוד {hidden} לומדות
        </button>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="למחוק את הלומדה?"
        message={`"${pendingDelete?.title || 'לומדה ללא שם'}" יימחק מהדפדפן יחד עם התמונות שלו. אם שמרתם קובץ ‎.course.zip‎, אפשר לפתוח אותו שוב.`}
        onConfirm={() => {
          if (pendingDelete) onRemove(pendingDelete);
          setPendingDelete(null);
        }}
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
