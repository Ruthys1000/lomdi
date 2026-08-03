import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '../ui/IconButton';

export interface OverflowAction {
  id: string;
  icon: typeof MoreHorizontal;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * תפריט ״עוד״ לסרגל העליון במובייל.
 *
 * מתחת ל-lg אין מקום לכל פעולות הסרגל בשורה אחת — Preview ו-Save נשארים
 * גלויים, והשאר עוברים לכאן כדי שלא ייחתכו מחוץ למסך.
 */
export function TopBarOverflowMenu({ actions }: { actions: OverflowAction[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative lg:hidden">
      <IconButton
        tone="shell"
        icon={MoreHorizontal}
        label="עוד פעולות"
        active={open}
        onClick={() => setOpen((value) => !value)}
      />

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="עוד פעולות"
          className="absolute top-full z-50 mt-1 min-w-48 rounded-xl border border-shell-edge bg-shell-2 p-1 shadow-lg end-0"
        >
          {actions.map(({ id, icon: Icon, label, onClick, disabled }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm text-shell-fg transition',
                'hover:bg-shell disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              <Icon className="size-4 shrink-0 text-shell-muted" aria-hidden />
              <OverflowLabel>{label}</OverflowLabel>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** מוריד סוגריים של קיצור מקלדת מהתווית — בתפריט מובייל אין צורך בהם */
function OverflowLabel({ children }: { children: ReactNode }) {
  if (typeof children !== 'string') return children;
  return <>{children.replace(/\s*\([^)]*\)\s*$/u, '')}</>;
}
