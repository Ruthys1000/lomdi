import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { blockLabel } from '@/blocks/labels';
import { cn } from '@/lib/cn';
import type { Block } from '@/model/types';

interface BlockRowProps {
  block: Block;
  selected: boolean;
  onSelect: () => void;
}

/** שורת בלוק בסרגל המבנה — ניתנת לבחירה ולגרירה, גם בין פרקים */
export function BlockRow({ block, selected, onSelect }: BlockRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group/row flex items-center gap-1', isDragging && 'opacity-40')}
    >
      <button
        type="button"
        aria-label={`גרירת ${blockLabel(block.type)}`}
        className="cursor-grab rounded p-0.5 text-fg-muted opacity-0 transition group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:text-fg-soft active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" aria-hidden />
      </button>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-start text-xs transition',
          selected
            ? 'bg-volt-soft font-semibold text-volt'
            : 'text-fg-muted hover:bg-app hover:text-fg',
        )}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-current opacity-40" />
        <span className="truncate">{blockLabel(block.type)}</span>
      </button>
    </li>
  );
}
