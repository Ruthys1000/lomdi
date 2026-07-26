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
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-sand-200 p-0 shadow-xl backdrop:bg-sand-900/40"
    >
      <div className="p-6 text-right">
        <h2 className="text-base font-bold text-sand-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-sand-600">{message}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-lg bg-plum-600 px-4 py-2 text-sm font-semibold text-white hover:bg-plum-700'
                : 'rounded-lg bg-clay-600 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-700'
            }
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-semibold text-sand-700 hover:bg-sand-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
