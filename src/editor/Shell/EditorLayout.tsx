import { EditorCanvas } from '../Canvas/EditorCanvas';
import { InspectorPanel } from '../Inspector/InspectorPanel';
import { OutlinePanel } from '../Outline/OutlinePanel';
import { TopBar } from './TopBar';

/**
 * מבנה שלושת האזורים (סעיף 4).
 *
 * סדר האלמנטים ב-DOM הוא מבנה → קנבס → הגדרות. מכיוון שהממשק ב-RTL,
 * הסדר הזה מציב את המבנה מימין ואת ההגדרות משמאל בדיוק כנדרש, בלי
 * לקבוע מיקום מפורש — וכשתתווסף תמיכה ב-LTR הפריסה תתהפך מעצמה.
 */
export function EditorLayout() {
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
