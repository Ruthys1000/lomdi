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
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-edge bg-panel text-fg p-0 shadow-xl backdrop:bg-scrim/40"
    >
      <div className="p-6 text-right">
        <h2 className="text-base font-bold text-fg">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-soft">{message}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-on-danger hover:opacity-90'
                : 'rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-on-volt hover:bg-volt-bright'
            }
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-fg-soft hover:bg-app"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
