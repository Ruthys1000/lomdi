import { useCallback } from 'react';
import { CourseRenderer, type BlockWrapper } from '@/renderer/CourseRenderer';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore, viewportWidths } from '@/state/editorStore';
import { BlockFrame } from './BlockFrame';

/**
 * אזור העבודה המרכזי (סעיף 4.3).
 *
 * הקנבס אינו מרנדר בלוקים בעצמו — הוא מפעיל את אותו CourseRenderer של
 * התוצר, ומזריק דרכו את מסגרת העריכה. כך "מה שרואים בעורך" הוא פשוט
 * "מה שהלומד יראה", עם שכבה דקה מעליו.
 *
 * בעריכה מוצג פרק אחד בלבד — זה שנבחר במבנה — גם כשהלומדה מוגדרת לגלילה
 * רציפה. אחרת עריכת פרק אחרון בלומדה ארוכה הייתה דורשת גלילה מתמדת.
 */
export function EditorCanvas() {
  const course = useCourseStore((state) => state.course);
  const selectedChapterId = useEditorStore((state) => state.selectedChapterId);
  const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
  const selectBlock = useEditorStore((state) => state.selectBlock);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const viewport = useEditorStore((state) => state.viewport);

  // בשלב 6 יוחלף במיפוי אמיתי של נכסים; כרגע אין עדיין נכסים בפרויקט
  const resolveAssetUrl = useCallback(() => undefined, []);

  const renderBlockWrapper = useCallback<BlockWrapper>(
    (block, rendered) => (
      <BlockFrame
        block={block}
        selected={selectedBlockId === block.id}
        onSelect={() => selectBlock(block.id)}
      >
        {rendered}
      </BlockFrame>
    ),
    [selectedBlockId, selectBlock],
  );

  if (!course) return null;

  const chapterIndex = Math.max(
    0,
    course.chapters.findIndex((chapter) => chapter.id === selectedChapterId),
  );
  const width = viewportWidths[viewport];

  return (
    <section
      className="min-h-0 overflow-y-auto bg-slate-100 p-6"
      aria-label="אזור העריכה"
      onClick={(event) => {
        // לחיצה על הרקע מבטלת בחירה, אבל לא לחיצה על בלוק
        if (event.target === event.currentTarget) clearSelection();
      }}
    >
      <div
        className="mx-auto overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-[max-width] duration-200"
        style={{ maxWidth: width ? `${width}px` : '100%' }}
      >
        <CourseRenderer
          course={course}
          resolveAssetUrl={resolveAssetUrl}
          isEditing
          forcedChapterIndex={chapterIndex}
          renderBlockWrapper={renderBlockWrapper}
        />
      </div>
    </section>
  );
}
