import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ChapterNode } from './ChapterNode';

/**
 * סרגל מבנה הלומדה (סעיף 4.2).
 *
 * מציג את הפרקים ואת הבלוקים שבתוכם, ומאפשר בחירה, שינוי שם, שכפול
 * ומחיקה. גרירה לשינוי סדר מתווספת בשלב 4 — ובמכוון היא תרוכז כאן ולא
 * בקנבס, כי העברת בלוק בין פרקים ברשימה אנכית אחת יציבה בהרבה מגרירה
 * בין אזורים נפרדים.
 */
export function OutlinePanel() {
  const course = useCourseStore((state) => state.course);
  const addChapter = useCourseStore((state) => state.addChapter);
  const removeChapter = useCourseStore((state) => state.removeChapter);
  const selectChapter = useEditorStore((state) => state.selectChapter);

  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  if (!course) return null;

  const handleAddChapter = () => {
    const id = addChapter();
    if (id) selectChapter(id);
  };

  const confirmDelete = () => {
    if (pendingDelete) removeChapter(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <aside className="flex min-h-0 flex-col bg-white" aria-label="מבנה הלומדה">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-xs font-bold tracking-wide text-slate-500 uppercase">מבנה הלומדה</h2>
        <button
          type="button"
          onClick={handleAddChapter}
          title="הוספת פרק"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <Plus className="size-3.5" aria-hidden />
          פרק
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
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

        {course.chapters.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-slate-400">
            אין עדיין פרקים בלומדה.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="מחיקת פרק"
        message={`הפרק "${pendingDelete?.title}" וכל הבלוקים שבתוכו יימחקו. אי אפשר לבטל את הפעולה בשלב זה.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </aside>
  );
}
