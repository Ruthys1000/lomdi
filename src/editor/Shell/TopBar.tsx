import {
  BookOpen,
  Download,
  Eye,
  FolderOpen,
  Monitor,
  Redo2,
  Save,
  Settings,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import { courseHistory, useCourseStore } from '@/state/courseStore';
import { useEditorStore, type Viewport } from '@/state/editorStore';
import { toast } from '@/state/toastStore';
import { useHistoryState } from '../shortcuts/useHistoryState';
import { IconButton } from '../ui/IconButton';

const viewports: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'מחשב', icon: Monitor },
  { id: 'tablet', label: 'טאבלט', icon: Tablet },
  { id: 'mobile', label: 'מובייל', icon: Smartphone },
];

/**
 * הסרגל העליון (סעיף 4.1).
 *
 * הפעולות שעדיין אינן ממומשות מוצגות כמושבתות ולא מוסתרות: כך המשתמש
 * רואה לאן המוצר הולך, ובו בזמן לא נתקל בכפתור שנראה עובד ואינו עושה
 * דבר. הן ייפתחו בשלבים 4, 6 ו-7.
 */
export function TopBar() {
  const course = useCourseStore((state) => state.course);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const viewport = useEditorStore((state) => state.viewport);
  const setViewport = useEditorStore((state) => state.setViewport);
  const setPreviewOpen = useEditorStore((state) => state.setPreviewOpen);
  const { canUndo, canRedo } = useHistoryState();

  if (!course) return null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BookOpen className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-bold tracking-tight">LearnIt</span>
      </div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <label className="min-w-0 flex-1">
        <span className="sr-only">שם הפרויקט</span>
        <input
          value={course.title}
          onChange={(event) => updateCourse({ title: event.target.value })}
          placeholder="שם הלומדה"
          className="w-full max-w-md truncate rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-1">
        <IconButton
          icon={Undo2}
          label="ביטול (Ctrl+Z)"
          disabled={!canUndo}
          onClick={() => {
            courseHistory.undo();
            toast('הפעולה בוטלה');
          }}
        />
        <IconButton
          icon={Redo2}
          label="ביצוע מחדש (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={() => {
            courseHistory.redo();
            toast('בוצע מחדש');
          }}
        />
      </div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div
        className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5"
        role="group"
        aria-label="תצוגה לפי מכשיר"
      >
        {viewports.map(({ id, label, icon }) => (
          <IconButton
            key={id}
            icon={icon}
            label={label}
            active={viewport === id}
            onClick={() => setViewport(id)}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-1">
        <IconButton icon={Eye} label="תצוגה מקדימה" onClick={() => setPreviewOpen(true)}>
          תצוגה מקדימה
        </IconButton>
        <IconButton icon={Save} label="שמירת פרויקט (בשלב 6)" disabled />
        <IconButton icon={FolderOpen} label="טעינת פרויקט (בשלב 6)" disabled />
        <IconButton icon={Download} label="ייצוא HTML (בשלב 7)" disabled />
        <IconButton icon={Settings} label="הגדרות (בשלב 3)" disabled />
      </div>
    </header>
  );
}
