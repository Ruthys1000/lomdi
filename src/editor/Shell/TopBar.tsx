import { useRef, useState } from 'react';
import {
  BookOpen,
  Download,
  Eye,
  FolderOpen,
  Images,
  Monitor,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import { downloadProjectFile, openProjectFile } from '@/persistence/session';
import { courseHistory, useCourseStore } from '@/state/courseStore';
import { useEditorStore, type Viewport } from '@/state/editorStore';
import { toast } from '@/state/toastStore';
import { APP_NAME } from '@/version';
import { AssetLibraryModal } from '../Assets/AssetLibraryModal';
import { ExportDialog } from '../Export/ExportDialog';
import { useHistoryState } from '../shortcuts/useHistoryState';
import { IconButton } from '../ui/IconButton';
import { SaveIndicator } from './SaveIndicator';

const viewports: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'מחשב', icon: Monitor },
  { id: 'tablet', label: 'טאבלט', icon: Tablet },
  { id: 'mobile', label: 'מובייל', icon: Smartphone },
];

/**
 * הסרגל העליון (סעיף 4.1).
 *
 * שתי פעולות השמירה נפרדות בכוונה: הפרויקט נשמר אוטומטית בדפדפן, ו"שמירת
 * קובץ פרויקט" מורידה `.course.zip` להעברה בין מחשבים או לגיבוי. מחוון
 * המצב לצדן הוא מה שהופך את ההפרדה למובנת — בלעדיו "שמירה" נראית כמו
 * פעולה שהמשתמש חייב לזכור לבצע.
 */
export function TopBar() {
  const course = useCourseStore((state) => state.course);
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const viewport = useEditorStore((state) => state.viewport);
  const setViewport = useEditorStore((state) => state.setViewport);
  const setPreviewOpen = useEditorStore((state) => state.setPreviewOpen);
  const isOutlineOpen = useEditorStore((state) => state.isOutlineOpen);
  const isInspectorOpen = useEditorStore((state) => state.isInspectorOpen);
  const setOutlineOpen = useEditorStore((state) => state.setOutlineOpen);
  const setInspectorOpen = useEditorStore((state) => state.setInspectorOpen);
  const { canUndo, canRedo } = useHistoryState();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!course) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadProjectFile();
      toast('קובץ הפרויקט ירד למחשב', { tone: 'success' });
    } catch {
      toast('יצירת קובץ הפרויקט נכשלה', { tone: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenFile = async (file: File) => {
    const result = await openProjectFile(file);

    if (!result.ok) {
      toast(result.errors[0], { tone: 'error' });
      return;
    }

    for (const warning of result.warnings) toast(warning, { tone: 'error' });
    toast('הפרויקט נטען', { tone: 'success' });
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-edge bg-panel px-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-volt text-app">
          <BookOpen className="size-4" aria-hidden />
        </span>
        <span className="hidden text-sm font-bold tracking-tight sm:inline">{APP_NAME}</span>
      </div>

      {/* פותחי המגירות. מוסתרים מ-lg ומעלה, שם שני הפאנלים בגריד ממילא */}
      <div className="flex items-center gap-1 lg:hidden">
        <IconButton
          icon={PanelRight}
          label="מבנה הלומדה"
          active={isOutlineOpen}
          onClick={() => setOutlineOpen(!isOutlineOpen)}
        />
        <IconButton
          icon={PanelLeft}
          label="הגדרות"
          active={isInspectorOpen}
          onClick={() => setInspectorOpen(!isInspectorOpen)}
        />
      </div>

      <div className="mx-1 hidden h-6 w-px bg-edge sm:block" />

      <label className="min-w-0 flex-1">
        <span className="sr-only">שם הפרויקט</span>
        <input
          value={course.title}
          onChange={(event) => updateCourse({ title: event.target.value })}
          placeholder="שם הלומדה"
          className="w-full min-w-24 max-w-xs truncate rounded-lg border border-transparent px-2 py-1.5 text-sm font-semibold hover:border-edge focus:border-volt-dim focus:bg-panel focus:outline-none"
        />
      </label>

      <SaveIndicator />

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

      <div className="mx-1 h-6 w-px bg-edge" />

      <div
        className="hidden items-center gap-0.5 rounded-lg bg-panel-2 p-0.5 lg:flex"
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

      <div className="mx-1 h-6 w-px bg-edge" />

      <div className="flex items-center gap-1">
        <IconButton icon={Images} label="ספריית הנכסים" onClick={() => setAssetsOpen(true)} />
        <IconButton icon={Eye} label="תצוגה מקדימה" onClick={() => setPreviewOpen(true)} />
        <IconButton
          icon={Save}
          label="שמירת קובץ פרויקט (‎.course.zip‎)"
          disabled={downloading}
          onClick={() => void handleDownload()}
        />
        <IconButton
          icon={FolderOpen}
          label="פתיחת קובץ פרויקט"
          onClick={() => fileInputRef.current?.click()}
        />
        <IconButton
          icon={Download}
          label="ייצוא לומדה עצמאית (ZIP)"
          onClick={() => setExportOpen(true)}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void handleOpenFile(file);
        }}
      />

      <AssetLibraryModal open={assetsOpen} onClose={() => setAssetsOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </header>
  );
}
