import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from 'lucide-react';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { cn } from '@/lib/cn';

interface BlockToolbarProps {
  visible: boolean;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
}

/**
 * סרגל הפעולות שמופיע בריחוף על בלוק (סעיף 4.3).
 *
 * הגרירה מופעלת רק מהידית ולא מכל שטח הבלוק, כדי שסימון טקסט בתוך בלוק
 * טקסט לא ייהפך בטעות לגרירה.
 */
export function BlockToolbar({
  visible,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  dragAttributes,
  dragListeners,
}: BlockToolbarProps) {
  return (
    <div
      className={cn(
        'absolute -top-3.5 z-30 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm transition',
        'start-2',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <button
        type="button"
        aria-label="גרירה לשינוי סדר"
        title="גרירה לשינוי סדר"
        className="cursor-grab rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
        {...dragAttributes}
        {...dragListeners}
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>

      <ToolbarAction icon={ArrowUp} label="העברה למעלה" onClick={onMoveUp} disabled={!canMoveUp} />
      <ToolbarAction
        icon={ArrowDown}
        label="העברה למטה"
        onClick={onMoveDown}
        disabled={!canMoveDown}
      />
      <ToolbarAction icon={Copy} label="שכפול" onClick={onDuplicate} />

      <span className="mx-0.5 h-4 w-px bg-slate-200" aria-hidden />

      <ToolbarAction icon={Trash2} label="מחיקה" onClick={onDelete} destructive />
    </div>
  );
}

function ToolbarAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'rounded p-1 transition disabled:cursor-not-allowed disabled:opacity-30',
        destructive
          ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}
