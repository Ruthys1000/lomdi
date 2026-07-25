import { useState, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import type { Block } from '@/model/types';
import { BlockFrame } from './BlockFrame';
import { BlockToolbar } from './BlockToolbar';

interface SortableBlockProps {
  block: Block;
  selected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/**
 * בלוק בקנבס: מסגרת, סרגל פעולות ויכולת גרירה.
 *
 * הגרירה מופעלת רק מהידית שבסרגל (`useSortable` בלי listeners על הגוף),
 * כדי שסימון טקסט בתוך בלוק לא ייהפך לגרירה. הידית מקבלת את המאזינים
 * דרך ה-props של הסרגל.
 */
export function SortableBlock({
  block,
  selected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-40 opacity-40')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BlockToolbar
        visible={hovered || selected}
        onDuplicate={onDuplicate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDelete={onDelete}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        dragAttributes={attributes}
        dragListeners={listeners}
      />

      <BlockFrame block={block} selected={selected} onSelect={onSelect}>
        {children}
      </BlockFrame>
    </div>
  );
}
