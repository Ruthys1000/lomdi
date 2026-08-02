import { useRef, useState } from 'react';
import { BookOpen, FileUp, FolderOpen, Upload } from 'lucide-react';
import { openProjectFile } from '@/persistence/session';
import { getTemplate } from '@/templates';
import type { TemplateResult } from '@/templates';
import { APP_NAME, APP_VERSION } from '@/version';
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
 * **נחיתה אחת לכולם.** אותו דף בדיוק למבקר חדש ולחוזר: Hero עם מחולל
 * הלומדות בלבו, ומתחתיו סוגר עם CTA וייבוא קובץ. הדף *הוא* ה-landing,
 * ואפשר לחזור אליו מהעורך גם אחרי שכבר נבנו לומדות.
 *
 * **הלומדות השמורות חיות בחוצץ נפרד** (MyCoursesDrawer) שנפתח מכפתור בפס
 * העליון — ולא כרצועה שדוחפת את הנחיתה מטה. הכפתור מופיע רק כשיש לומדות.
 *
 * נשמר מהגרסה הקודמת: גרירת קובץ פרויקט על *כל* המסך עם שכבת יעד, כי
 * הגרירה תמיד תפסה את כל המסך אבל שום דבר לא הראה זאת.
 */
export function WelcomeScreen({ onStart, onOpened }: WelcomeScreenProps) {
  const { featured, rest, open, remove } = useRecentProjects(onOpened);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  // רשימה אחת של כל הלומדות, האחרונה-שנפתחה (featured) ראשונה
  const allProjects = featured ? [featured, ...rest] : rest;
  const hasProjects = featured != null;

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

  return (
    <main
      className="relative min-h-full overflow-y-auto bg-app"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave נורה גם במעבר בין אלמנטים פנימיים; בלי הבדיקה הזו
        // שכבת היעד מהבהבת בזמן שגוררים מעל התוכן
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
      <Header hasProjects={hasProjects} onOpenCourses={() => setCoursesOpen(true)} />

      {/* נחיתה אחת לכולם — מוצגת תמיד, גם אחרי שנבנו לומדות */}
      <Hero onBuild={() => startTemplate('blank')} />
      <Closer loading={loading} fileErrors={fileErrors} onPickFile={pickFile} />

      {/* חוצץ "הלומדות שלי" — נפתח מהפס העליון, מחוץ לגלילת הנחיתה */}
      <MyCoursesDrawer
        open={coursesOpen}
        onClose={() => setCoursesOpen(false)}
        projects={allProjects}
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

      {/* שכבת היעד. על כל המסך ולא על קופסה אחת */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-app/85 p-8">
          <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-volt-dim bg-panel/90 px-8 py-12">
            <FileUp className="size-8 text-volt-ink" aria-hidden />
            <p className="text-lg font-bold text-fg">שחררו. זה נטען לבד.</p>
            <p className="text-sm text-fg-muted">‎.course.zip‎</p>
          </div>
        </div>
      )}
    </main>
  );
}

interface HeaderProps {
  /** יש לומדות שמורות — רק אז מוצג כפתור "הלומדות שלי" */
  hasProjects: boolean;
  onOpenCourses: () => void;
}

/** הפס העליון הכהה. כשיש עבודה שמורה, נוסף כפתור לפתיחת חוצץ "הלומדות שלי". */
function Header({ hasProjects, onOpenCourses }: HeaderProps) {
  return (
    <header className="lc-shell border-b border-shell-edge bg-shell">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-volt text-on-volt">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-shell-fg">{APP_NAME}</h1>
          <p className="text-xs text-shell-muted">מטקסט ללומדה, עם AI</p>
        </div>

        {hasProjects && (
          <button
            type="button"
            onClick={onOpenCourses}
            className="ms-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-shell-edge px-3.5 py-2 text-sm font-semibold text-shell-fg transition hover:border-volt-dim hover:text-volt"
          >
            <FolderOpen className="size-4" aria-hidden />
            הלומדות שלי
          </button>
        )}
      </div>
    </header>
  );
}

interface CloserProps {
  loading: boolean;
  fileErrors: string[];
  onPickFile: () => void;
}

/** סוגר הדף: ייבוא קובץ קיים + שורת אמון. מוצג תמיד, זהה לכולם. */
function Closer({ loading, fileErrors, onPickFile }: CloserProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-11">
      <ImportRow loading={loading} fileErrors={fileErrors} onPickFile={onPickFile} />

      <Footer />
    </section>
  );
}

/** רצועת ייבוא קובץ קיים */
function ImportRow({
  loading,
  fileErrors,
  onPickFile,
}: {
  loading: boolean;
  fileErrors: string[];
  onPickFile: () => void;
}) {
  return (
    <section aria-labelledby="open-heading">
      <h2 id="open-heading" className="sr-only">
        יש קובץ לומדה?
      </h2>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-edge-strong bg-panel px-5 py-4">
        <Upload className="size-5 shrink-0 text-fg-muted" aria-hidden />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-fg-muted">
          כבר יש לכם קובץ לומדה? גררו אותו לכאן — לכל מקום במסך — כדי להמשיך לערוך.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={onPickFile}
          className="rounded-xl border border-edge-strong px-4 py-2 text-sm font-semibold text-fg-soft transition hover:border-volt-dim hover:text-volt-ink disabled:opacity-50"
        >
          {loading ? 'טוען…' : 'בחירת קובץ'}
        </button>
      </div>

      {fileErrors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
          {fileErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** שורת האמון והגרסה */
function Footer() {
  return (
    <p className="mt-8 text-center text-xs text-fg-muted">
      {APP_NAME} {APP_VERSION} · העריכה נשמרת אצלכם בדפדפן.
    </p>
  );
}
