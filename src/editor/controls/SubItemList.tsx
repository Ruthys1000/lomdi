import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Identified {
  id: string;
}

interface SubItemListProps<T extends Identified> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** יוצר פריט חדש עם מזהה חדש */
  createItem: () => T;
  /** משכפל פריט קיים; חייב להחזיר מזהה חדש */
  duplicateItem: (item: T) => T;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel: string;
  minItems?: number;
  maxItems?: number;
}

/**
 * רשימת תת-פריטים עם הוספה, שכפול, מחיקה וסידור בגרירה.
 *
 * רכיב אחד לשלושה בלוקים — כרטיסים, פריטי אקורדיון ותשובות לשאלה — כי
 * שלושתם מנהלים בדיוק את אותה רשימה.
 *
 * הרשימה חיה בפאנל ההגדרות ולא על הקנבס, גם כשהתצוגה בפועל אופקית
 * (כרטיסים). זו המשך ההחלטה משלב 4: גרירה אנכית ברשימה אחת יציבה, בעוד
 * שגרירה אופקית ב-RTL היא בדיוק המקום שבו חישובי ה-collision של dnd-kit
 * נשברים.
 */
export function SubItemList<T extends Identified>({
  label,
  items,
  onChange,
  createItem,
  duplicateItem,
  renderItem,
  addLabel,
  minItems = 1,
  maxItems = 12,
}: SubItemListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from === -1 || to === -1) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const insertAfter = (index: number, item: T) => {
    const next = [...items];
    next.splice(index + 1, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-fg-soft">{label}</span>
        <span className="text-[11px] text-fg-muted tabular-nums">{items.length}</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {items.map((item, index) => (
              <SubItemRow
                key={item.id}
                id={item.id}
                canDelete={items.length > minItems}
                canDuplicate={items.length < maxItems}
                onDuplicate={() => insertAfter(index, duplicateItem(item))}
                onDelete={() => onChange(items.filter((_, i) => i !== index))}
              >
                {renderItem(item, index)}
              </SubItemRow>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        disabled={items.length >= maxItems}
        onClick={() => onChange([...items, createItem()])}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-edge-strong px-3 py-2 text-xs font-semibold text-fg-soft transition hover:border-volt-dim hover:text-volt-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-3.5" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

function SubItemRow({
  id,
  canDelete,
  canDuplicate,
  onDuplicate,
  onDelete,
  children,
}: {
  id: string;
  canDelete: boolean;
  canDuplicate: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'rounded-xl border border-edge bg-panel p-2.5',
        isDragging && 'opacity-40 shadow-md',
      )}
    >
      <div className="mb-2 flex items-center gap-0.5">
        <button
          type="button"
          aria-label="גרירה לשינוי סדר"
          title="גרירה לשינוי סדר"
          className="cursor-grab rounded p-1 text-fg-muted transition hover:text-fg-soft active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>

        <span className="flex-1" />

        <button
          type="button"
          onClick={onDuplicate}
          disabled={!canDuplicate}
          aria-label="שכפול"
          title="שכפול"
          className="rounded p-1 text-fg-muted transition hover:bg-panel-2 hover:text-fg-soft disabled:opacity-30"
        >
          <Copy className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="מחיקה"
          title={canDelete ? 'מחיקה' : 'לא ניתן למחוק את הפריט האחרון'}
          className="rounded p-1 text-fg-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-30"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="space-y-2">{children}</div>
    </li>
  );
}
