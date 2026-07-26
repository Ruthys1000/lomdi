import { useRef, useState } from 'react';
import { BookOpen, FileUp, Globe, Languages, Plus, Upload, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { openProjectFile } from '@/persistence/session';
import { getTemplate } from '@/templates';
import type { TemplateResult } from '@/templates';
import { APP_NAME, APP_VERSION } from '@/version';
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
 * מסך הפתיחה (סעיף 5).
 *
 * שלוש החלטות שמעצבות אותו:
 *
 * 1. **הפעולות קודמות לרשימה.** "לומדה חדשה" ו"המשך לערוך" יושבים בפס
 *    אחד מתחת לכותרת, לפני כל רשימה. מי שהתחיל עשר לומדות רואה את שתי
 *    הפעולות מיד, ולא מגלגל מתחת לרשימה כדי למצוא אותן.
 * 2. **אין גלריית תבניות.** שלושה כרטיסים עם סקיצות מופשטות נראו כמעט
 *    זהים ולא עזרו לבחור. במקומם כפתור ראשי אחד, ושתי נקודות כניסה
 *    נוספות כקישורי טקסט למי שרוצה מבנה מוכן או דוגמה.
 * 3. **גרירת קובץ פרויקט חלה על כל המסך**, עם שכבת יעד על כל המסך בזמן
 *    גרירה — ולא הצהבה של קופסה קטנה שקשה לכוון אליה.
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

  return (
    <main
      className="relative min-h-full overflow-y-auto bg-app"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave נורה גם במעבר בין אלמנטים פנימיים; בלי הבדיקה הזו
        // שכבת היעד מהבהבת בזמן שגוררים מעל הכרטיסים
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
      {/* אותו פס כהה של העורך — רצועת הזיהוי היחידה בשני המסכים */}
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

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/*
          פס הפעולה. שתי העמודות הן שתי הפעולות שבשבילן באים לכאן, והן מעל
          הקיפול תמיד — גם כשיש עשרות לומדות שמורות.
        */}
        <div className={cn('grid gap-4', featured && 'sm:grid-cols-2')}>
          {featured && <FeaturedProject project={featured} onOpen={() => void open(featured.id)} />}

          {/*
            בלי לומדות שמורות זהו כל המסך, ולכן הוא ממורכז ונדיב. עם לומדה
            מובילה לצדו הוא חצי שורה, ולכן הוא מיושר להתחלה כמו שכנו.
          */}
          <section
            className={cn(
              'flex flex-col rounded-2xl border border-edge bg-panel p-5',
              !featured && 'items-center px-6 py-12 text-center',
            )}
            aria-labelledby="new-heading"
          >
            <h2 id="new-heading" className="text-xs font-bold tracking-wide text-fg-muted uppercase">
              {featured ? 'לומדה חדשה' : 'עוד אין כאן כלום'}
            </h2>

            <p
              className={cn(
                'mt-3 font-bold text-balance text-fg',
                featured ? 'text-lg' : 'max-w-xl text-3xl leading-tight',
              )}
            >
              לומדה שמסיימים עד הסוף.
            </p>

            <p
              className={cn(
                'mt-3 leading-relaxed text-fg-muted',
                featured ? 'text-sm' : 'max-w-md text-base',
              )}
            >
              בונים מבלוקים, מקבלים תיקייה שרצה לבד. בלי שרת, בלי אינטרנט, בלי לחכות לאף אחד.
            </p>

            <button
              type="button"
              onClick={() => startTemplate('blank')}
              /*
               * מלא רק כשאין לומדה מובילה.
               *
               * כששתי הפעולות על המסך, "ממשיכים" הוא הסביר מביניהן, ושני
               * כפתורי לאים זהים זה לצד זה מבטלים זה את זה — אין שום דבר
               * שאומר במה להתחיל. הכפתור נשאר גלוי ומעל הקיפול, רק מתוחם
               * במקום מלא.
               */
              className={cn(
                'mt-5 inline-flex items-center gap-2 rounded-xl font-semibold transition',
                featured
                  ? 'self-start border border-edge-strong px-5 py-2.5 text-sm text-fg hover:border-volt-dim hover:text-volt-ink'
                  : 'bg-volt px-7 py-3.5 text-base text-on-volt hover:bg-volt-bright',
              )}
            >
              <Plus className="size-4" aria-hidden />
              בונים לומדה
            </button>

            {/* שתי נקודות כניסה נוספות כטקסט ולא ככרטיסים: הן נחוצות פעם
                אחת בחיים של משתמש, ולא מגיע להן שליש מהמסך */}
            <p className="mt-3 text-sm text-fg-muted">
              או{' '}
              <button
                type="button"
                onClick={() => startTemplate('shortTraining')}
                className="font-semibold text-volt-ink underline underline-offset-2 transition hover:text-fg"
              >
                מבנה מוכן
              </button>{' '}
              ·{' '}
              <button
                type="button"
                onClick={() => startTemplate('sample')}
                className="font-semibold text-volt-ink underline underline-offset-2 transition hover:text-fg"
              >
                לומדת הדוגמה
              </button>
            </p>
          </section>
        </div>

        {/* נעלם מעצמו ברגע שיש לומדה ראשונה — ראו HowItWorks */}
        {!featured && <HowItWorks />}

        {error && (
          <p className="mt-6 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
            {error}
          </p>
        )}

        <ProjectList
          projects={rest}
          onOpen={(id) => void open(id)}
          onRemove={(project) => void remove(project)}
        />

        <section className="mt-10" aria-labelledby="open-heading">
          <h2 id="open-heading" className="text-base font-bold text-fg">
            יש קובץ לומדה?
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-edge-strong bg-panel px-5 py-4">
            <Upload className="size-5 shrink-0 text-fg-muted" aria-hidden />

            <p className="min-w-0 flex-1 text-sm leading-relaxed text-fg-muted">
              גררו אותו לכאן — לכל מקום במסך. הקובץ כולל את התוכן, העיצוב והתמונות.
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
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
        </section>

        {/* אותן שלוש נקודות שבכותרת, למסכים צרים שבהם הן אינן נכנסות לשם */}
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-muted lg:hidden">
          {SELLING_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-fg-muted" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-fg-muted">
          {APP_NAME} {APP_VERSION} · נשמר אצלכם בדפדפן. לא עולה לשום שרת.
        </p>
      </div>

      {/* שכבת היעד. על כל המסך ולא על קופסה אחת — הגרירה תמיד תפסה את כל
          המסך, אבל שום דבר לא הראה את זה */}
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
