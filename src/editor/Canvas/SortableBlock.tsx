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
      /*
       * ה-pt-5 הוא מרזב הצ'רום.
       *
       * קודם לכן התווית וסרגל הפעולות נתלו *מעל* הבלוק (top שלילי), ומכאן
       * שני באגים: בבלוק הראשון הם נחתכו על ידי ה-overflow-hidden של גיליון
       * הקנבס, ובכל שאר הבלוקים הם ישבו על שורת התוכן הראשונה. מרזב קבוע
       * פותר את שניהם בלי להזיז את הצ'רום לתוך הבלוק, ששם הוא היה מכסה
       * טקסט גרוע יותר.
       *
       * המחיר הוא 20 פיקסלים בין בלוקים שאינם קיימים בתוצר המיוצא. זו
       * סטייה מכוונת מ-WYSIWYG: הרווח שייך לכלי, לא ללומדה.
       */
      className={cn('relative pt-7', isDragging && 'z-40 opacity-40')}
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
