import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ProjectSummary } from '@/persistence/db';
import { ProjectList } from './RecentProjects';

interface MyCoursesDrawerProps {
  open: boolean;
  onClose: () => void;
  /** כל הלומדות השמורות, האחרונה-שנפתחה ראשונה */
  projects: ProjectSummary[];
  onOpen: (id: string) => void;
  onRemove: (project: ProjectSummary) => void;
}

/**
 * מגירת "הלומדות שלי" (סעיף חוצץ).
 *
 * הנחיתה עצמה זהה לכל מבקר; הגישה ללומדות השמורות חיה כאן, בחוצץ נפרד
 * שנפתח מהפס העליון, ולא כרצועה שדוחפת את הנחיתה מטה.
 *
 * בנויה על `<dialog>` המובנה כמו שאר המודלים באפליקציה — focus trap,
 * סגירה ב-Escape ו-inert על הרקע מגיעים מהדפדפן. מיושרת לקצה ה-end בגובה
 * מלא (מגירה), ולא ממורכזת. הרשימה עצמה היא `ProjectList` הקיים, כולל
 * פתיחה, מחיקה עם אישור, וקיפול רשימה ארוכה.
 */
export function MyCoursesDrawer({ open, onClose, projects, onOpen, onRemove }: MyCoursesDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-label="הלומדות שלי"
      className="my-0 me-0 ms-auto h-dvh max-h-dvh w-[min(26rem,calc(100vw-3rem))] rounded-none rounded-s-2xl border-s border-edge bg-panel p-0 text-fg shadow-2xl backdrop:bg-scrim/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-edge px-5 py-4">
          <h2 className="text-base font-bold text-fg">הלומדות שלי</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-lg p-2 text-fg-muted transition hover:bg-panel-2 hover:text-fg"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ProjectList projects={projects} onOpen={onOpen} onRemove={onRemove} />
        </div>
      </div>
    </dialog>
  );
}
