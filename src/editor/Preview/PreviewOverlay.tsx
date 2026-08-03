import { useEffect } from 'react';
import { Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { CourseRenderer } from '@/renderer/CourseRenderer';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore, viewportWidths, type Viewport } from '@/state/editorStore';
import { useAssetUrlResolver } from '../Assets/useAssetUrlResolver';
import { useBackClose } from '../shortcuts/useBackClose';
import { IconButton } from '../ui/IconButton';

const devices: { id: Viewport; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'מחשב', icon: Monitor },
  { id: 'tablet', label: 'טאבלט', icon: Tablet },
  { id: 'mobile', label: 'מובייל', icon: Smartphone },
];

/**
 * תצוגה מקדימה (סעיף 15).
 *
 * מרנדרת את אותו CourseRenderer של התוצר, בלי שום כלי עריכה ובלי
 * forcedChapterIndex — כלומר עם מנגנון הניווט האמיתי של הלומדה. זה מה
 * שהופך את התצוגה המקדימה לבדיקה אמיתית ולא לקירוב.
 */
export function PreviewOverlay() {
  const course = useCourseStore((state) => state.course);
  const isOpen = useEditorStore((state) => state.isPreviewOpen);
  const setPreviewOpen = useEditorStore((state) => state.setPreviewOpen);
  const viewport = useEditorStore((state) => state.viewport);
  const setViewport = useEditorStore((state) => state.setViewport);

  const resolveAssetUrl = useAssetUrlResolver();

  // "חזרה" של הדפדפן סוגר את התצוגה המקדימה במקום לצאת מהאתר
  useBackClose(isOpen, () => setPreviewOpen(false));

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setPreviewOpen]);

  if (!isOpen || !course) return null;

  const width = viewportWidths[viewport];

  return (
    <div className="lc-shell fixed inset-0 z-50 flex flex-col bg-shell" role="dialog" aria-modal="true" aria-label="תצוגה מקדימה">
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-shell-edge px-4 text-shell-fg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">תצוגה מקדימה</span>
          <span className="text-xs text-shell-muted">{course.title}</span>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg bg-shell-2 p-0.5">
          {devices.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewport(id)}
              aria-pressed={viewport === id}
              title={label}
              aria-label={label}
              className={
                viewport === id
                  ? 'rounded-md bg-volt px-2 py-1.5 text-on-volt'
                  : 'rounded-md px-2 py-1.5 text-shell-muted hover:text-shell-fg'
              }
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>

        <IconButton
          tone="shell"
          icon={X}
          label="סגירת התצוגה המקדימה"
          onClick={() => setPreviewOpen(false)}
        >
          סגירה
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-shell-2 p-4">
        <div
          className="mx-auto min-h-full overflow-hidden rounded-xl bg-white shadow-2xl transition-[max-width] duration-200"
          style={{ maxWidth: width ? `${width}px` : '1100px' }}
        >
          {/* authoring: התצוגה המקדימה היא סביבת היוצר — מציגה placeholder
              לתמונה עם הפרומפט המומלץ, שלא ייכנס לתוצר של הלומד */}
          <CourseRenderer course={course} resolveAssetUrl={resolveAssetUrl} authoring />
        </div>
      </div>
    </div>
  );
}
