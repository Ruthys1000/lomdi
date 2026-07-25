import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * חלון אישור לפני פעולה הרסנית (סעיף 20).
 *
 * בנוי על <dialog> המובנה כדי לקבל focus trap, סגירה ב-Escape ו-inert על
 * הרקע מהדפדפן עצמו, במקום לממש את כל אלה ביד ולשכוח חלק.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'מחיקה',
  cancelLabel = 'ביטול',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
        onCancel();
      }}
      onClose={onCancel}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6 text-right">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700'
                : 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700'
            }
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
