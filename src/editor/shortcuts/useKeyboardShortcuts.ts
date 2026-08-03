import { useEffect } from 'react';
import { courseHistory, useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { toast } from '@/state/toastStore';

/**
 * קיצורי המקלדת של העורך (סעיף 20).
 *
 * הנקודה העדינה כאן היא ההתנגשות עם עריכת טקסט: כשהפוקוס נמצא בתוך שדה
 * או בתוך עורך הטקסט העשיר, Ctrl+Z חייב לבטל תו — לא למחוק את הבלוק
 * האחרון שנוסף. לכן כל קיצור שיש לו משמעות גם בעריכה נבדק מול
 * `document.activeElement` ומוותר כשהפוקוס בתוך תוכן.
 */

function isEditingText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export interface ShortcutHandlers {
  onSave?: () => void;
  onDeleteBlock?: (blockId: string) => void;
}

export function useKeyboardShortcuts({ onSave, onDeleteBlock }: ShortcutHandlers = {}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      const editing = isEditingText(event.target);

      if (event.key === 'Escape') {
        const { isPreviewOpen, setPreviewOpen, isHelpOpen, setHelpOpen, clearSelection } =
          useEditorStore.getState();
        if (isHelpOpen) setHelpOpen(false);
        else if (isPreviewOpen) setPreviewOpen(false);
        else clearSelection();
        return;
      }

      // `?` פותח את גיליון הקיצורים. מדלגים כשהפוקוס בתוך טקסט, כדי לא לחטוף
      // תו שהמשתמש מקליד; `?` דורש Shift ולכן אין התנגשות עם מקש בודד.
      if (event.key === '?' && !editing) {
        event.preventDefault();
        useEditorStore.getState().setHelpOpen(true);
        return;
      }

      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave?.();
        return;
      }

      // TipTap מנהל היסטוריה משלו כשהפוקוס בתוכו; התערבות כאן הייתה
      // גורמת ל-Ctrl+Z למחוק בלוק שלם במקום תו אחד
      // הטוסט נשמר רק למקרה שבו *לא* קרה כלום. כשהביטול מצליח, השינוי על
      // הקנבס הוא המשוב — ומי שמקליק Ctrl+Z ברצף לא צריך מגדל הודעות. אבל
      // קיצור מקלדת שלא עושה כלום ואינו מסביר למה נראה כמו תקלה, ולכן
      // דווקא הקצה החסום מדבר.
      if (modifier && event.key.toLowerCase() === 'z' && !editing) {
        event.preventDefault();
        if (event.shiftKey) {
          if (courseHistory.canRedo()) courseHistory.redo();
          else toast('אין פעולה לביצוע מחדש');
        } else {
          if (courseHistory.canUndo()) courseHistory.undo();
          else toast('אין פעולה לביטול');
        }
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && !editing) {
        const { selectedBlockId } = useEditorStore.getState();
        const course = useCourseStore.getState().course;
        if (!selectedBlockId || !course) return;

        event.preventDefault();
        onDeleteBlock?.(selectedBlockId);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onSave, onDeleteBlock]);
}
