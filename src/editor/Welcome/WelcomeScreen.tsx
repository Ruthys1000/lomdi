import { useRef, useState } from 'react';
import { BookOpen, FileUp, Globe, Languages, Plus, Upload, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { openProjectFile } from '@/persistence/session';
import { getTemplate } from '@/templates';
import type { TemplateResult } from '@/templates';
import { APP_NAME, APP_VERSION } from '@/version';
import { FeaturedProject, ProjectList } from './RecentProjects';
import { useRecentProjects } from './useRecentProjects';

interface WelcomeScreenProps {
  onStart: (result: TemplateResult) => void;
  /** נקרא כשפרויקט קיים נטען ישירות ל-stores, בלי לעבור דרך onStart */
  onOpened: () => void;
}

const SELLING_POINTS = [
  { icon: WifiOff, text: 'רץ בלי שרת ובלי אינטרנט' },
  { icon: Languages, text: 'עברית ו-RTL מהיסוד' },
  { icon: Globe, text: 'ZIP להעלאה ל-Moodle' },
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
      className="relative min-h-full overflow-y-auto bg-sand-50"
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
      <header className="border-b border-sand-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sand-900 text-white">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-sand-900">{APP_NAME}</h1>
            <p className="text-xs text-sand-500">מחולל לומדות HTML מבוסס בלוקים</p>
          </div>

          <ul className="ms-auto hidden gap-5 text-xs text-sand-500 lg:flex">
            {SELLING_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-sand-400" aria-hidden />
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
              'flex flex-col rounded-2xl border border-sand-200 bg-white p-5',
              !featured && 'items-center px-6 py-12 text-center',
            )}
            aria-labelledby="new-heading"
          >
            <h2 id="new-heading" className="text-xs font-bold tracking-wide text-sand-500 uppercase">
              לומדה חדשה
            </h2>

            <p
              className={cn(
                'mt-3 font-bold text-balance text-sand-900',
                featured ? 'text-lg' : 'max-w-lg text-2xl leading-snug',
              )}
            >
              בונים מבלוקים, ומקבלים תיקייה שרצה לבד בכל דפדפן.
            </p>

            <button
              type="button"
              onClick={() => startTemplate('blank')}
              className={cn(
                'mt-4 inline-flex items-center gap-2 rounded-xl bg-clay-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-700',
                featured ? 'self-start' : 'px-6 py-3 text-base',
              )}
            >
              <Plus className="size-4" aria-hidden />
              לומדה חדשה
            </button>

            {/* שתי נקודות כניסה נוספות כטקסט ולא ככרטיסים: הן נחוצות פעם
                אחת בחיים של משתמש, ולא מגיע להן שליש מהמסך */}
            <p className="mt-3 text-sm text-sand-500">
              או{' '}
              <button
                type="button"
                onClick={() => startTemplate('shortTraining')}
                className="font-semibold text-clay-700 underline underline-offset-2 transition hover:text-clay-800"
              >
                מבנה מוכן של שלושה פרקים
              </button>{' '}
              ·{' '}
              <button
                type="button"
                onClick={() => startTemplate('sample')}
                className="font-semibold text-clay-700 underline underline-offset-2 transition hover:text-clay-800"
              >
                לומדת הדוגמה
              </button>
            </p>
          </section>
        </div>

        {error && (
          <p className="mt-6 rounded-xl bg-ochre-50 px-4 py-3 text-sm leading-relaxed text-ochre-800">
            {error}
          </p>
        )}

        <ProjectList
          projects={rest}
          onOpen={(id) => void open(id)}
          onRemove={(project) => void remove(project)}
        />

        <section className="mt-10" aria-labelledby="open-heading">
          <h2 id="open-heading" className="text-base font-bold text-sand-900">
            פתיחה מקובץ פרויקט
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-sand-300 bg-white px-5 py-4">
            <Upload className="size-5 shrink-0 text-sand-400" aria-hidden />

            <p className="min-w-0 flex-1 text-sm leading-relaxed text-sand-500">
              גררו לכאן קובץ ‎.course.zip‎ — לכל מקום במסך. הוא כולל את התוכן, העיצוב והתמונות.
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-sand-300 px-4 py-2 text-sm font-semibold text-sand-700 transition hover:border-clay-300 hover:text-clay-700 disabled:opacity-50"
            >
              {loading ? 'טוען…' : 'בחירת קובץ'}
            </button>
          </div>

          {fileErrors.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-ochre-50 px-4 py-3 text-sm leading-relaxed text-ochre-800">
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
        <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-sand-500 lg:hidden">
          {SELLING_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-sand-400" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-sand-400">
          {APP_NAME} {APP_VERSION} · הלומדות נשמרות בדפדפן שלכם בלבד ואינן נשלחות לשום שרת
        </p>
      </div>

      {/* שכבת היעד. על כל המסך ולא על קופסה אחת — הגרירה תמיד תפסה את כל
          המסך, אבל שום דבר לא הראה את זה */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-sand-50/85 p-8">
          <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-clay-400 bg-white/90 px-8 py-12">
            <FileUp className="size-8 text-clay-600" aria-hidden />
            <p className="text-lg font-bold text-sand-900">שחררו כאן את קובץ הפרויקט</p>
            <p className="text-sm text-sand-500">‎.course.zip‎</p>
          </div>
        </div>
      )}
    </main>
  );
}
