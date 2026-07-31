import { useEffect, useRef } from 'react';

/**
 * גיליון קיצורי המקלדת.
 *
 * מקור-האמת של הקיצורים הוא `shortcuts/useKeyboardShortcuts.ts` — כל שינוי
 * שם מחייב שורה כאן, אחרת המקרא משקר. בנוי על <dialog> המובנה כדי לקבל
 * focus-trap, Escape ו-inert על הרקע מהדפדפן, בדיוק כמו `ConfirmDialog`.
 */

interface ShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts: { keys: string; action: string }[] = [
  { keys: 'Ctrl/⌘ + Z', action: 'ביטול הפעולה האחרונה' },
  { keys: 'Ctrl/⌘ + Shift + Z', action: 'ביצוע מחדש' },
  { keys: 'Ctrl/⌘ + S', action: 'שמירה מיידית לדפדפן (לא הורדת קובץ)' },
  { keys: 'Delete', action: 'מחיקת הבלוק הנבחר (עם אישור)' },
  { keys: 'Escape', action: 'ביטול בחירה או סגירת חלון' },
  { keys: '?', action: 'פתיחת מסך הקיצורים הזה' },
];

export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
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
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-edge bg-panel text-fg p-0 shadow-xl backdrop:bg-scrim/40"
    >
      <div className="p-6 text-right">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-fg">קיצורי מקלדת</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-lg border border-edge px-2.5 py-1 text-sm font-semibold text-fg-soft hover:bg-app"
          >
            סגירה
          </button>
        </div>

        <dl className="mt-4 divide-y divide-edge">
          {shortcuts.map(({ keys, action }) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sm text-fg-soft">{action}</dt>
              <dd>
                <kbd
                  dir="ltr"
                  className="inline-block rounded-md border border-edge bg-app px-2 py-1 text-xs font-semibold text-fg"
                >
                  {keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-fg-soft">
          בתוך שדה טקסט או עורך טקסט עשיר, ‎Ctrl+Z‎ שייך לעריכת הטקסט ולא לאפליקציה.
        </p>
      </div>
    </dialog>
  );
}
