import { useCallback, useState } from 'react';
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
import { blockLabel } from '@/blocks/labels';
import { CourseRenderer, type BlockWrapper } from '@/renderer/CourseRenderer';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore, viewportWidths } from '@/state/editorStore';
import { toast } from '@/state/toastStore';
import { useAssetUrlResolver } from '../Assets/useAssetUrlResolver';
import { BlockLibraryModal } from '../BlockLibrary/BlockLibraryModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { InsertPoint } from './InsertPoint';
import { SortableBlock } from './SortableBlock';

/**
 * אזור העבודה המרכזי (סעיף 4.3).
 *
 * הקנבס אינו מרנדר בלוקים בעצמו — הוא מפעיל את אותו CourseRenderer של
 * התוצר ומזריק דרכו את מסגרת העריכה. כך "מה שרואים בעורך" הוא בדיוק
 * "מה שהלומד יראה", עם שכבה דקה מעליו.
 *
 * הגרירה כאן מוגבלת לסידור בתוך הפרק הנוכחי, ולציר האנכי בלבד. העברה
 * בין פרקים נעשית בסרגל המבנה, שם היא רשימה אנכית אחת — פתרון יציב
 * בהרבה מגרירה בין שני אזורים נפרדים, ובמיוחד ב-RTL.
 */
export function EditorCanvas() {
  const course = useCourseStore((state) => state.course);
  const addBlock = useCourseStore((state) => state.addBlock);
  const removeBlock = useCourseStore((state) => state.removeBlock);
  const duplicateBlock = useCourseStore((state) => state.duplicateBlock);
  const nudgeBlock = useCourseStore((state) => state.nudgeBlock);
  const moveBlockWithinChapter = useCourseStore((state) => state.moveBlockWithinChapter);

  const selectedChapterId = useEditorStore((state) => state.selectedChapterId);
  const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
  const selectBlock = useEditorStore((state) => state.selectBlock);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const viewport = useEditorStore((state) => state.viewport);
  const blockPendingDelete = useEditorStore((state) => state.blockPendingDelete);
  const requestBlockDelete = useEditorStore((state) => state.requestBlockDelete);
  const cancelBlockDelete = useEditorStore((state) => state.cancelBlockDelete);

  const [libraryIndex, setLibraryIndex] = useState<number | null>(null);

  const resolveAssetUrl = useAssetUrlResolver();

  const sensors = useSensors(
    // סף של 6 פיקסלים: בלי זה כל לחיצה על בלוק נחשבת לתחילת גרירה
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const chapterIndex = Math.max(
    0,
    course?.chapters.findIndex((chapter) => chapter.id === selectedChapterId) ?? 0,
  );
  const chapter = course?.chapters[chapterIndex];

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!chapter || !over || active.id === over.id) return;

    const from = chapter.blocks.findIndex((block) => block.id === active.id);
    const to = chapter.blocks.findIndex((block) => block.id === over.id);
    if (from === -1 || to === -1) return;

    moveBlockWithinChapter(chapter.id, from, to);
  };

  const handleAddBlock = (type: string) => {
    if (!chapter) return;
    const id = addBlock(chapter.id, type, libraryIndex ?? undefined);
    setLibraryIndex(null);

    if (!id) return;
    selectBlock(id, chapter.id);
    toast(`נוסף בלוק ${blockLabel(type)}`, { tone: 'success' });

    // גלילה לבלוק החדש אחרי שהוא נכנס ל-DOM (סעיף 8)
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-block-id="${id}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const pendingBlock = blockPendingDelete
    ? (course?.chapters.flatMap((item) => item.blocks).find((b) => b.id === blockPendingDelete) ??
      null)
    : null;

  const confirmDelete = () => {
    if (!pendingBlock) return;
    removeBlock(pendingBlock.id);
    if (selectedBlockId === pendingBlock.id) clearSelection();
    toast(`הבלוק ${blockLabel(pendingBlock.type)} נמחק`, { tone: 'info' });
    cancelBlockDelete();
  };

  const renderBlockWrapper = useCallback<BlockWrapper>(
    (block, rendered) => {
      const index = chapter?.blocks.findIndex((item) => item.id === block.id) ?? -1;

      return (
        <>
          <InsertPoint
            label={`הוספת בלוק לפני ${blockLabel(block.type)}`}
            onClick={() => setLibraryIndex(index)}
          />
          <SortableBlock
            block={block}
            selected={selectedBlockId === block.id}
            canMoveUp={index > 0 || chapterIndex > 0}
            canMoveDown={
              index < (chapter?.blocks.length ?? 0) - 1 ||
              chapterIndex < (course?.chapters.length ?? 0) - 1
            }
            onSelect={() => selectBlock(block.id)}
            onDuplicate={() => {
              const id = duplicateBlock(block.id);
              if (id) selectBlock(id);
              toast('הבלוק שוכפל', { tone: 'success' });
            }}
            onMoveUp={() => nudgeBlock(block.id, -1)}
            onMoveDown={() => nudgeBlock(block.id, 1)}
            onDelete={() => requestBlockDelete(block.id)}
          >
            {rendered}
          </SortableBlock>
        </>
      );
    },
    [
      chapter,
      chapterIndex,
      course?.chapters.length,
      selectedBlockId,
      selectBlock,
      duplicateBlock,
      nudgeBlock,
      requestBlockDelete,
    ],
  );

  if (!course) return null;

  const width = viewportWidths[viewport];

  return (
    <section
      className="min-h-0 overflow-y-auto bg-panel-2 px-0 py-2 sm:p-4 lg:p-6"
      aria-label="אזור העריכה"
      onClick={(event) => {
        if (event.target === event.currentTarget) clearSelection();
      }}
    >
      <div
        className="mx-auto overflow-hidden bg-white shadow-sm ring-1 ring-edge transition-[max-width] duration-200 sm:rounded-xl"
        style={{ maxWidth: width ? `${width}px` : '100%' }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapter?.blocks.map((block) => block.id) ?? []}
            strategy={verticalListSortingStrategy}
          >
            <CourseRenderer
              course={course}
              resolveAssetUrl={resolveAssetUrl}
              isEditing
              authoring
              forcedChapterIndex={chapterIndex}
              renderBlockWrapper={renderBlockWrapper}
              renderEmptyChapter={() => (
                <button
                  type="button"
                  onClick={() => setLibraryIndex(0)}
                  className="mx-auto my-10 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-edge-strong px-8 py-12 text-center text-fg-soft transition hover:border-volt-dim hover:text-volt-ink"
                >
                  <Plus className="size-7" aria-hidden />
                  <span className="text-base font-semibold">הפרק ריק — הוסיפו את הבלוק הראשון</span>
                  <span className="text-sm text-fg-muted">בחרו בלוק מהספרייה כדי להתחיל לבנות</span>
                </button>
              )}
            />
          </SortableContext>
        </DndContext>
      </div>

      <div className="mx-auto mt-4 flex justify-center" style={{ maxWidth: width ? `${width}px` : '100%' }}>
        <button
          type="button"
          onClick={() => setLibraryIndex(chapter?.blocks.length ?? 0)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-edge-strong bg-panel px-4 py-2.5 text-sm font-semibold text-fg-soft transition hover:border-volt-dim hover:text-volt-ink"
        >
          <Plus className="size-4" aria-hidden />
          הוספת בלוק
        </button>
      </div>

      <BlockLibraryModal
        open={libraryIndex !== null}
        onClose={() => setLibraryIndex(null)}
        onPick={handleAddBlock}
      />

      <ConfirmDialog
        open={pendingBlock !== null}
        title="מחיקת בלוק"
        message={`הבלוק ${pendingBlock ? blockLabel(pendingBlock.type) : ''} יימחק מהפרק. אפשר לבטל את הפעולה עם Ctrl+Z.`}
        onConfirm={confirmDelete}
        onCancel={cancelBlockDelete}
      />
    </section>
  );
}
