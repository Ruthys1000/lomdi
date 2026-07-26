import { useCallback, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
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
  const isOutlineOpen = useEditorStore((state) => state.isOutlineOpen);
  const isInspectorOpen = useEditorStore((state) => state.isInspectorOpen);
  const setOutlineOpen = useEditorStore((state) => state.setOutlineOpen);
  const setInspectorOpen = useEditorStore((state) => state.setInspectorOpen);

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
    <div className="flex h-full flex-col overflow-hidden bg-panel-2">
      <TopBar />

      {/*
        שלוש פריסות ולא אחת. הגריד הקבוע של 280+300 השאיר לקנבס 444 פיקסלים
        ב-1024 ו-160 ב-768 — כלומר העורך היה בלתי שמיש בדיוק במסכים שבהם
        הרבה אנשים עובדים. מתחת ל-lg הפאנלים יוצאים מהזרימה והופכים למגירות
        מעל הקנבס, ונפתחים מהכפתורים בסרגל העליון.
      */}
      <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-px bg-edge lg:grid-cols-[240px_minmax(0,1fr)_280px] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Drawer side="start" open={isOutlineOpen} onClose={() => setOutlineOpen(false)}>
          <OutlinePanel />
        </Drawer>

        <EditorCanvas />

        <Drawer side="end" open={isInspectorOpen} onClose={() => setInspectorOpen(false)}>
          <InspectorPanel />
        </Drawer>
      </div>
    </div>
  );
}

/**
 * עוטף פאנל צדדי.
 *
 * מעל lg הוא שקוף לחלוטין — הפאנל יושב בגריד כמו קודם. מתחת ל-lg הוא
 * הופך את הפאנל לשכבה מעל הקנבס עם רקע כהה מאחוריו. אותו רכיב `OutlinePanel`
 * ו-`InspectorPanel` משמש בשני המצבים, ולכן אין שתי גרסאות לתחזק.
 */
function Drawer({
  side,
  open,
  onClose,
  children,
}: {
  side: 'start' | 'end';
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="סגירת הפאנל"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-app/40 lg:hidden"
        />
      )}

      <div
        className={cn(
          'z-40 flex min-h-0 flex-col bg-panel lg:z-auto lg:translate-x-0 lg:shadow-none',
          'max-lg:fixed max-lg:inset-y-0 max-lg:w-72 max-lg:shadow-xl max-lg:transition-transform',
          side === 'start' ? 'max-lg:start-0' : 'max-lg:end-0',
          !open && 'max-lg:hidden',
        )}
      >
        {children}
      </div>
    </>
  );
}
