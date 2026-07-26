import { useRef, useState } from 'react';
import { BookOpen, FileUp, Globe, Languages, Plus, Upload, WifiOff } from 'lucide-react';
import type { ProjectSummary } from '@/persistence/db';
import { openProjectFile } from '@/persistence/session';
import { getTemplate } from '@/templates';
import type { TemplateResult } from '@/templates';
import { APP_NAME, APP_VERSION } from '@/version';
import { BuildingBlocks } from './BuildingBlocks';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { FeaturedProject, ProjectList } from './RecentProjects';
import { useRecentProjects } from './useRecentProjects';

interface WelcomeScreenProps {
  onStart: (result: TemplateResult) => void;
  /** נקרא כשפרויקט קיים נטען ישירות ל-stores, בלי לעבור דרך onStart */
  onOpened: () => void;
}

const SELLING_POINTS = [
  { icon: WifiOff, text: 'בלי שרת, בלי אינטרנט' },
  { icon: Languages, text: 'עברית ו-RTL מהיסוד' },
  { icon: Globe, text: 'מוכן ל-Moodle' },
];

/**
 * מסך הפתיחה — הדלת הראשית של הכלי, דו-מצבי:
 *
 * 1. **מבקר חדש (אין לומדות שמורות)** → נחיתה מספרת-סיפור: Hero עם מיני-לומדי
 *    חי, "איך עובדים" כפס ייצור, ובנטו הבלוקים. מסביר תוך שנייה מה הכלי עושה
 *    ואיך עובדים איתו.
 * 2. **מבקר חוזר (יש לומדות שמורות)** → משגר קומפקטי: "ממשיכים" + "לומדה
 *    חדשה" מעל הקיפול, רשימת הלומדות, והסיפור מתקפל לרצועת-תזכורת אחת. מי
 *    שהתחיל עשר לומדות לא מגלגל דרך סיפור כדי לחזור לעבודה.
 *
 * ההסתעפות על `featured` (הלומדה האחרונה): קיומה = יש כבר עבודה שמורה.
 *
 * נשמר מהגרסה הקודמת: גרירת קובץ פרויקט על *כל* המסך עם שכבת יעד, כי
 * הגרירה תמיד תפסה את כל המסך אבל שום דבר לא הראה זאת.
 */
export function WelcomeScreen({ onStart, onOpened }: WelcomeScreenProps) {
  const { featured, rest, error, open, remove } = useRecentProjects(onOpened);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

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
      <Header />

      {/*
        דף אחד לכולם. הנחיתה (Hero, איך עובדים, הבלוקים) מוצגת תמיד — כך
        אפשר לחזור אליה מהעורך גם אחרי שכבר נבנו לומדות. למבקר חוזר נוספת
        למעלה רצועת "ממשיכים" + הלומדות שלו, לפני הסיפור.
      */}
      {featured && (
        <ReturningTop
          featured={featured}
          rest={rest}
          error={error}
          onOpen={(id) => void open(id)}
          onRemove={(project) => void remove(project)}
          onBuild={() => startTemplate('blank')}
          onShort={() => startTemplate('shortTraining')}
          onSample={() => startTemplate('sample')}
        />
      )}

      <Hero onBuild={() => startTemplate('blank')} onSample={() => startTemplate('sample')} />
      <HowItWorks />
      <BuildingBlocks />
      <Closer
        isReturning={featured != null}
        onBuild={() => startTemplate('blank')}
        loading={loading}
        fileErrors={fileErrors}
        onPickFile={pickFile}
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

/** הפס העליון הכהה — רצועת הזיהוי המשותפת לשני המצבים */
function Header() {
  return (
    <header className="lc-shell border-b border-shell-edge bg-shell">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-volt text-on-volt">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-shell-fg">{APP_NAME}</h1>
          <p className="text-xs text-shell-muted">בונים לומדה, מקבלים אתר</p>
        </div>

        <ul className="ms-auto hidden gap-5 text-xs text-shell-muted lg:flex">
          {SELLING_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-shell-muted" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

interface ReturningTopProps {
  featured: ProjectSummary;
  rest: ProjectSummary[];
  error: string | null;
  onOpen: (id: string) => void;
  onRemove: (project: ProjectSummary) => void;
  onBuild: () => void;
  onShort: () => void;
  onSample: () => void;
}

/**
 * רצועת המבקר החוזר, מעל הסיפור: "ממשיכים" + "לומדה חדשה" + "הלומדות שלי".
 * מה שחוזרים בשבילו יושב מעל הקיפול; הנחיתה המלאה נמשכת מתחת.
 */
function ReturningTop({
  featured,
  rest,
  error,
  onOpen,
  onRemove,
  onBuild,
  onShort,
  onSample,
}: ReturningTopProps) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <FeaturedProject project={featured} onOpen={() => onOpen(featured.id)} />

        <section
          className="flex flex-col rounded-2xl border border-edge bg-panel p-5"
          aria-labelledby="new-heading"
        >
          <h2 id="new-heading" className="text-xs font-bold tracking-wide text-fg-muted uppercase">
            לומדה חדשה
          </h2>
          <p className="mt-3 text-lg font-bold text-balance text-fg">לומדה שמסיימים עד הסוף.</p>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            בונים מבלוקים, מקבלים תיקייה שרצה לבד.
          </p>

          <button
            type="button"
            onClick={onBuild}
            className="mt-5 inline-flex items-center gap-2 self-start rounded-xl border border-edge-strong px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-volt-dim hover:text-volt-ink"
          >
            <Plus className="size-4" aria-hidden />
            מתחילים לבנות
          </button>

          <p className="mt-3 text-sm text-fg-muted">
            או{' '}
            <button
              type="button"
              onClick={onShort}
              className="font-semibold text-volt-ink underline underline-offset-2 transition hover:text-fg"
            >
              מבנה מוכן
            </button>{' '}
            ·{' '}
            <button
              type="button"
              onClick={onSample}
              className="font-semibold text-volt-ink underline underline-offset-2 transition hover:text-fg"
            >
              לומדת הדוגמה
            </button>
          </p>
        </section>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
          {error}
        </p>
      )}

      <ProjectList projects={rest} onOpen={onOpen} onRemove={onRemove} />
    </div>
  );
}

interface CloserProps {
  isReturning: boolean;
  onBuild: () => void;
  loading: boolean;
  fileErrors: string[];
  onPickFile: () => void;
}

/** סוגר הדף: CTA שקט + ייבוא קובץ קיים + שורת אמון. מוצג תמיד. */
function Closer({ isReturning, onBuild, loading, fileErrors, onPickFile }: CloserProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-11">
      {/* CTA שקט אחד — לא רצועה גדולה; הנוסח משתנה בין ראשונה להבאה */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-center">
        <p className="text-lg font-extrabold text-balance text-fg md:text-xl">
          {isReturning ? 'מוכנים ללומדה הבאה?' : 'מוכנים? הלומדה הראשונה שלכם במרחק בלוק אחד.'}
        </p>
        <button
          type="button"
          onClick={onBuild}
          className="inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-3 font-extrabold text-on-volt transition hover:bg-volt-bright"
        >
          <Plus className="size-4.5" aria-hidden />
          מתחילים לבנות
        </button>
      </div>

      <div className="mt-7">
        <ImportRow loading={loading} fileErrors={fileErrors} onPickFile={onPickFile} />
      </div>

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
      {APP_NAME} {APP_VERSION} · נשמר אצלכם בדפדפן. לא עולה לשום שרת.
    </p>
  );
}
