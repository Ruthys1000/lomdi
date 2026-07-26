import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { ProjectSummary } from '@/persistence/db';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/**
 * "המשך מהמקום שבו הפסקת" (סעיף 12).
 *
 * שני רכיבים ולא אחד, מסיבה מבנית: הלומדה האחרונה צריכה לשבת בפס הפעולה
 * העליון לצד "לומדה חדשה", ואילו שאר הרשימה יושבת הרבה מתחתיו. רכיב אחד
 * שמרנדר את שניהם היה מכריח את "לומדה חדשה" לרדת אל מתחת לרשימה — ומי
 * שהתחיל עשר לומדות היה מגלגל כדי למצוא אותו.
 *
 * הנתונים מגיעים מ-`useRecentProjects`.
 */

/** כמה לומדות מוצגות לפני "עוד" — רשימה ארוכה דוחפת את שאר המסך מטה */
const COLLAPSED_COUNT = 4;

/** כרטיס הלומדה האחרונה — הפעולה הסבירה ביותר של מי שכבר עבד כאן */
export function FeaturedProject({
  project,
  onOpen,
}: {
  project: ProjectSummary;
  onOpen: () => void;
}) {
  return (
    <section
      className="flex flex-col rounded-2xl border border-sand-200 bg-white p-5"
      aria-labelledby="featured-heading"
    >
      <h2 id="featured-heading" className="text-xs font-bold tracking-wide text-sand-500 uppercase">
        המשך מהמקום שבו הפסקת
      </h2>

      <p className="mt-3 truncate text-lg font-bold text-sand-900">
        {project.title || 'לומדה ללא שם'}
      </p>
      <p className="mt-1 text-sm text-sand-500">
        {project.chapterCount} פרקים · {project.blockCount} בלוקים · {formatSavedAt(project.savedAt)}
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 self-start rounded-xl bg-sand-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sand-800"
      >
        המשך לערוך
      </button>
    </section>
  );
}

/** שאר הלומדות. מקופלת מעבר ל-COLLAPSED_COUNT כדי לא לדחוף את המסך */
export function ProjectList({
  projects,
  onOpen,
  onRemove,
}: {
  projects: ProjectSummary[];
  onOpen: (id: string) => void;
  onRemove: (project: ProjectSummary) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null);

  if (projects.length === 0) return null;

  const visible = expanded ? projects : projects.slice(0, COLLAPSED_COUNT);
  const hidden = projects.length - visible.length;

  return (
    <section className="mt-10" aria-labelledby="all-projects-heading">
      <h2 id="all-projects-heading" className="text-base font-bold text-sand-900">
        הלומדות שלי
      </h2>

      <ul className="mt-3 overflow-hidden rounded-2xl border border-sand-200 bg-white">
        {visible.map((project) => (
          <li
            key={project.id}
            className="flex items-center gap-2 border-b border-sand-200 ps-4 pe-2 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onOpen(project.id)}
              className="min-w-0 flex-1 py-3 text-start"
            >
              <span className="block truncate text-sm font-semibold text-sand-900">
                {project.title || 'לומדה ללא שם'}
              </span>
              <span className="mt-0.5 block text-xs text-sand-500">
                {project.chapterCount} פרקים · {project.blockCount} בלוקים ·{' '}
                {formatSavedAt(project.savedAt)}
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
              aria-label={`מחיקת ${project.title || 'הלומדה'}`}
              title="מחיקה"
              className="rounded-lg p-2 text-sand-400 transition hover:bg-plum-50 hover:text-plum-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-clay-700 transition hover:text-clay-800"
        >
          <ChevronDown className="size-4" aria-hidden />
          עוד {hidden} לומדות
        </button>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="מחיקת הפרויקט מהמחשב"
        message={`"${pendingDelete?.title || 'לומדה ללא שם'}" יימחק מהאחסון של הדפדפן יחד עם הנכסים שלו. אם יש לכם קובץ ‎.course.zip‎ שמור, אפשר יהיה לפתוח אותו שוב.`}
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
