import { useCallback, useEffect } from 'react';
import { saveNow, startAutosave } from '@/persistence/autosave';
import { useEditorStore } from '@/state/editorStore';
import { toast } from '@/state/toastStore';
import { EditorCanvas } from '../Canvas/EditorCanvas';
import { InspectorPanel } from '../Inspector/InspectorPanel';
import { OutlinePanel } from '../Outline/OutlinePanel';
import { useKeyboardShortcuts } from '../shortcuts/useKeyboardShortcuts';
import { TopBar } from './TopBar';

/**
 * מבנה שלושת האזורים (סעיף 4).
 *
 * סדר האלמנטים ב-DOM הוא מבנה → קנבס → הגדרות. מכיוון שהממשק ב-RTL,
 * הסדר הזה מציב את המבנה מימין ואת ההגדרות משמאל בדיוק כנדרש, בלי
 * לקבוע מיקום מפורש — וכשתתווסף תמיכה ב-LTR הפריסה תתהפך מעצמה.
 */
export function EditorLayout() {
  const requestBlockDelete = useEditorStore((state) => state.requestBlockDelete);

  // השמירה האוטומטית נרשמת ברמת הפריסה ולא ב-App: היא צריכה לרוץ רק כשיש
  // לומדה פתוחה, ומסך הפתיחה אינו מרנדר את הרכיב הזה
  useEffect(() => startAutosave(), []);

  useKeyboardShortcuts({
    // Ctrl+S שומר מיד לדפדפן. הורדת קובץ פרויקט היא פעולה נפרדת בסרגל,
    // כי היא יוצרת עותק ואינה "השמירה" שהמשתמש סומך עליה בזמן עבודה.
    onSave: useCallback(async () => {
      const saved = await saveNow();
      toast(saved ? 'הפרויקט נשמר' : 'השמירה נכשלה', { tone: saved ? 'success' : 'error' });
    }, []),
    onDeleteBlock: requestBlockDelete,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <TopBar />

      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_300px] gap-px bg-slate-200">
        <OutlinePanel />
        <EditorCanvas />
        <InspectorPanel />
      </div>
    </div>
  );
}
