import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, FileArchive, X } from 'lucide-react';
import { summarizeExport } from '@/export/checks';
import { exportCourseZip } from '@/export/exportCourse';
import { exportFileName, exportFolderName } from '@/export/exportZip';
import { formatBytes } from '@/persistence/assetNaming';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { toast } from '@/state/toastStore';

/**
 * חלון הייצוא (שלב 7).
 *
 * מציג מה ייארז ומה כדאי לדעת לפני ההורדה. האזהרות אינן חוסמות — הן
 * נועדו למנוע את התרחיש שבו המשתמש מגלה בלוק בלי תמונה או סרטון שדורש
 * אינטרנט רק אחרי שהלומדה כבר עלתה ל-Moodle.
 *
 * בנוי על `<dialog>` המובנה כמו שאר החלונות בעורך, ולכן focus trap, סגירה
 * ב-Escape ו-inert על הרקע מגיעים מהדפדפן ולא ממימוש ידני.
 *
 * שגיאת ייצוא מוצגת **בתוך** החלון ולא כ-toast: הודעת "יש להריץ npm run
 * build" חייבת להישאר על המסך עד שקוראים אותה.
 */
export function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const course = useCourseStore((state) => state.course);
  const assets = useAssetStore((state) => state.assets);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const summary = useMemo(
    () => (course ? summarizeExport(course, assets) : null),
    [course, assets],
  );

  if (!course || !summary) return null;

  const handleExport = async () => {
    setBusy(true);
    setError(null);

    try {
      const result = await exportCourseZip();
      toast(`הלומדה יוצאה — ${result.fileName}`, { tone: 'success' });
      if (result.missingAssetCount > 0) {
        toast(`${result.missingAssetCount} נכסים לא נארזו כי הקובץ שלהם לא היה זמין`, {
          tone: 'error',
        });
      }
      onClose();
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : 'ייצוא הלומדה נכשל.',
      );
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: 'פרקים', value: String(summary.chapterCount) },
    { label: 'בלוקים', value: String(summary.blockCount) },
    { label: 'נכסים', value: String(summary.assetCount) },
    { label: 'משקל המדיה', value: formatBytes(summary.assetBytes) },
  ];

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-label="ייצוא הלומדה"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-edge p-0 shadow-2xl backdrop:bg-app/40"
    >
      <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-volt-soft text-volt">
          <FileArchive className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-fg">ייצוא לומדה עצמאית</h2>
          <p className="truncate text-xs text-fg-muted">{course.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירת חלון הייצוא"
          className="rounded-lg p-1.5 text-fg-muted transition hover:bg-panel-2 hover:text-fg-soft"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
        <dl className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-app px-3 py-2 text-center">
              <dt className="text-[11px] text-fg-muted">{stat.label}</dt>
              <dd className="mt-0.5 text-sm font-bold text-fg" dir="ltr">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-fg-soft">
          הארכיון מכיל תיקייה אחת עם <code dir="ltr">index.html</code>, חבילת הלומדה והנכסים.
          פותחים את <code dir="ltr">index.html</code> בדאבל-קליק — בלי שרת, בלי התקנה ובלי חיבור
          לאינטרנט.
        </p>

        <pre
          dir="ltr"
          className="mt-3 overflow-x-auto rounded-xl bg-app px-4 py-3 text-left text-[11px] leading-relaxed text-fg-muted"
        >
          {`${exportFileName(course.title)}
└─ ${exportFolderName(course.title)}/
   ├─ index.html
   ├─ content.json
   ├─ runtime/app.js
   ├─ runtime/styles.css
   ├─ assets/…
   └─ README.txt`}
        </pre>

        {summary.warnings.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-xl bg-warn-soft px-4 py-3 text-xs leading-relaxed text-warn">
            {summary.warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {warning}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-xs leading-relaxed text-danger"
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-edge px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-fg-soft hover:bg-app"
        >
          ביטול
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleExport()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-app transition hover:bg-volt-bright disabled:opacity-50"
        >
          <Download className="size-4" aria-hidden />
          {busy ? 'אורז…' : 'ייצוא ZIP'}
        </button>
      </div>
    </dialog>
  );
}
