import { useRef, useState } from 'react';
import { BookOpen, FileUp, FolderOpen } from 'lucide-react';
import { getFormat, type FormatDefinition, type FormatId } from '@/formats';
import { openProjectFile } from '@/persistence/session';
import { getTemplate } from '@/templates';
import type { TemplateResult } from '@/templates';
import { APP_NAME, APP_VERSION } from '@/version';
import { Alert } from '../ui/Alert';
import { FormatsSection } from './FormatsSection';
import { Hero } from './Hero';
import { MyCoursesDrawer } from './MyCoursesDrawer';
import { useRecentProjects } from './useRecentProjects';

interface WelcomeScreenProps {
  onStart: (result: TemplateResult) => void;
  /** נקרא כשפרויקט קיים נטען ישירות ל-stores, בלי לעבור דרך onStart */
  onOpened: () => void;
}

/**
 * מסך הפתיחה — הדלת הראשית של הכלי.
 *
 * **נחיתה אחת לכולם, AI-first.** Hero עם מותג + הבטחה + CTA, ואז גלריית
 * פורמטים כשלב הבחירה. בנייה מדף ריק נשארת משנית. הלומדות השמורות חיות
 * במגירה בלבד — אין כרטיס "המשך" על הנחיתה.
 *
 * גרירת `.course.zip` עובדת על *כל* המסך; בחירת קובץ זמינה בשורת הפוטר.
 */
export function WelcomeScreen({ onStart, onOpened }: WelcomeScreenProps) {
  const { projects, error, openingId, open, remove } = useRecentProjects(onOpened);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [selected, setSelected] = useState<FormatDefinition | null>(null);

  const hasProjects = projects.length > 0;

  const handleFile = async (file: File) => {
    setLoading(true);
    setFileErrors([]);

    const result = await openProjectFile(file);
    setLoading(false);

    if (result.ok) onOpened();
    else setFileErrors(result.errors);
  };

  const startTemplate = (id: string) => {
    const create = getTemplate(id)?.create;
    if (create) onStart(create());
  };

  const pickFile = () => fileInputRef.current?.click();

  const goToFormats = () => {
    setSelected(null);
    document.getElementById('formats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectFormat = (id: FormatId) => {
    setSelected(getFormat(id) ?? null);
    // אחרי בחירה — הטופס צריך להיות בפריים; גלילה עדינה לכותרת הסקשן
    requestAnimationFrame(() => {
      document.getElementById('formats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <main
      className="relative min-h-full overflow-y-auto bg-app"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
    >
      <Header
        hasProjects={hasProjects}
        projectCount={projects.length}
        onOpenCourses={() => setCoursesOpen(true)}
      />

      {error && !coursesOpen && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <Alert messages={[error]} />
        </div>
      )}

      <Hero onCreateAi={goToFormats} onBuild={() => startTemplate('blank')} />
      <FormatsSection
        selected={selected}
        onSelect={selectFormat}
        onClear={() => setSelected(null)}
      />
      <Footer loading={loading} fileErrors={fileErrors} onPickFile={pickFile} />

      <MyCoursesDrawer
        open={coursesOpen}
        onClose={() => setCoursesOpen(false)}
        projects={projects}
        openingId={openingId}
        error={error}
        onOpen={(id) => void open(id)}
        onRemove={(project) => void remove(project)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void handleFile(file);
        }}
      />

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-app/85 p-8">
          <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-volt-dim bg-panel/90 px-8 py-12">
            <FileUp className="size-8 text-volt-ink" aria-hidden />
            <p className="text-lg font-bold text-fg">שחררו. זה נטען לבד.</p>
            <p className="text-sm text-fg-muted">‎.course.zip‎</p>
          </div>
        </div>
      )}

      {loading && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-app/70"
          role="status"
          aria-live="polite"
        >
          <p className="rounded-2xl bg-panel px-5 py-3 text-sm font-semibold text-fg shadow-lg">
            טוען את הלומדה…
          </p>
        </div>
      )}
    </main>
  );
}

interface HeaderProps {
  hasProjects: boolean;
  projectCount: number;
  onOpenCourses: () => void;
}

function Header({ hasProjects, projectCount, onOpenCourses }: HeaderProps) {
  return (
    <header className="lc-shell border-b border-shell-edge bg-shell">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-volt text-on-volt">
          <BookOpen className="size-4.5" aria-hidden />
        </span>
        <p className="text-sm font-bold tracking-tight text-shell-fg">{APP_NAME}</p>

        {hasProjects && (
          <button
            type="button"
            onClick={onOpenCourses}
            className="ms-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-shell-edge bg-shell-2 px-3.5 py-2 text-sm font-semibold text-shell-fg transition hover:border-volt-dim hover:text-volt"
          >
            <FolderOpen className="size-4" aria-hidden />
            הלומדות שלי
            <span className="rounded-md bg-shell px-1.5 py-0.5 text-[11px] font-bold text-volt tabular-nums">
              {projectCount}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

function Footer({
  loading,
  fileErrors,
  onPickFile,
}: {
  loading: boolean;
  fileErrors: string[];
  onPickFile: () => void;
}) {
  return (
    <footer className="border-t border-edge bg-panel/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-fg-muted">
          {APP_NAME} {APP_VERSION} · העריכה נשמרת אצלכם בדפדפן.
        </p>
        <p className="text-xs text-fg-muted">
          יש קובץ ‎.course.zip‎? גררו לכל מקום במסך, או{' '}
          <button
            type="button"
            disabled={loading}
            onClick={onPickFile}
            className="font-semibold text-volt-ink underline-offset-2 hover:underline disabled:opacity-50"
          >
            {loading ? 'טוען…' : 'בחרו קובץ'}
          </button>
          .
        </p>
      </div>
      {fileErrors.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-6">
          <Alert messages={fileErrors} />
        </div>
      )}
    </footer>
  );
}
