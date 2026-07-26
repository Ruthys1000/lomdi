import { useMemo, useState } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { toast } from '@/state/toastStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ChapterNode } from './ChapterNode';
import { flattenOutline, resolveDrop } from './outlineDnd';

/**
 * סרגל מבנה הלומדה (סעיף 4.2).
 *
 * כאן, ולא בקנבס, מתבצעת ההעברה של בלוק בין פרקים. הסיבה מבנית: כל
 * הפרקים והבלוקים משוטחים לרשימה אנכית אחת (ראה outlineDnd), ולכן
 * ההעברה היא הזזה בתוך רשימה — ולא multi-container sorting, שהוא החלק
 * השביר ביותר ב-dnd-kit ובמיוחד בממשק RTL.
 */
export function OutlinePanel() {
  const course = useCourseStore((state) => state.course);
  const addChapter = useCourseStore((state) => state.addChapter);
  const removeChapter = useCourseStore((state) => state.removeChapter);
  const moveChapter = useCourseStore((state) => state.moveChapter);
  const moveBlockToChapter = useCourseStore((state) => state.moveBlockToChapter);

  const selectChapter = useEditorStore((state) => state.selectChapter);
  const collapsedChapterIds = useEditorStore((state) => state.collapsedChapterIds);

  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = useMemo(
    () => (course ? flattenOutline(course, collapsedChapterIds) : []),
    [course, collapsedChapterIds],
  );

  if (!course) return null;

  const handleAddChapter = () => {
    const id = addChapter();
    if (id) {
      selectChapter(id);
      toast('נוסף פרק חדש', { tone: 'success' });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const result = resolveDrop(items, String(active.id), String(over.id));

    switch (result.type) {
      case 'moveChapter':
        moveChapter(result.from, result.to);
        break;
      case 'moveBlock':
        moveBlockToChapter(result.blockId, result.targetChapterId, result.targetIndex);
        break;
      default:
        break;
    }
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      removeChapter(pendingDelete.id);
      toast(`הפרק "${pendingDelete.title}" נמחק`);
    }
    setPendingDelete(null);
  };

  return (
    <aside className="flex min-h-0 flex-col bg-panel" aria-label="מבנה הלומדה">
      <div className="flex items-center justify-between border-b border-edge px-4 py-3">
        <h2 className="text-xs font-bold tracking-wide text-fg-muted uppercase">מבנה הלומדה</h2>
        <button
          type="button"
          onClick={handleAddChapter}
          title="הוספת פרק"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-volt transition hover:bg-volt-soft"
        >
          <Plus className="size-3.5" aria-hidden />
          פרק
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
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
            <ul className="space-y-1">
              {course.chapters.map((chapter, index) => (
                <ChapterNode
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  canDelete={course.chapters.length > 1}
                  onRequestDelete={() => setPendingDelete({ id: chapter.id, title: chapter.title })}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {course.chapters.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-fg-muted">אין עדיין פרקים בלומדה.</p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="מחיקת פרק"
        message={`הפרק "${pendingDelete?.title}" וכל הבלוקים שבתוכו יימחקו. אפשר לבטל את הפעולה עם Ctrl+Z.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </aside>
  );
}
