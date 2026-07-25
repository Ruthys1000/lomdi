import { useRef, useState } from 'react';
import { BookOpen, FileUp, FolderOpen, Globe, Languages, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { openProjectFile } from '@/persistence/session';
import { courseTemplates } from '@/templates';
import type { Course } from '@/model/types';
import { APP_NAME, APP_VERSION } from '@/version';
import { RecentProjects } from './RecentProjects';
import { TemplatePreview } from './TemplatePreview';

/** "פרק אחד" ולא "1 פרקים" — צורת רבים שגויה בעברית קופצת לעין מיד */
function countLabel(count: number, singular: string, plural: string): string {
  if (count === 1) return `${singular} אחד`;
  return `${count} ${plural}`;
}

interface WelcomeScreenProps {
  onStart: (course: Course) => void;
  /** נקרא כשפרויקט קיים נטען ישירות ל-stores, בלי לעבור דרך onStart */
  onOpened: () => void;
}

/**
 * מסך הפתיחה (סעיף 5).
 *
 * שלוש החלטות שמעצבות אותו:
 *
 * 1. **כרטיס תבנית מראה את התבנית.** `TemplatePreview` מרנדר סקיצה בצבעי
 *    הערכה של אותה תבנית, במקום אותו אייקון בשלושה כרטיסים זהים.
 * 2. **פרויקטים אחרונים קודמים לתבניות.** מי שכבר עבד כאן בא להמשיך, לא
 *    לבחור מחדש. כשאין פרויקטים הרכיב אינו מרנדר דבר, והתבניות עולות
 *    למעלה מאליהן.
 * 3. **גרירת קובץ פרויקט חלה על כל המסך** ולא על קופסה קטנה בתחתית —
 *    אותו דפוס שכבר קיים בספריית הנכסים.
 *
 * תבניות שעדיין אינן ממומשות מוצגות כשורת טקסט אחת ולא ככרטיסים מושבתים:
 * ההבטחה נשמרת בלי שלושה כרטיסים מתים שתופסים את מרכז המסך.
 */
export function WelcomeScreen({ onStart, onOpened }: WelcomeScreenProps) {
  const ready = courseTemplates.filter((template) => template.create);
  const planned = courseTemplates.filter((template) => !template.create);

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

  return (
    <main
      className="min-h-full overflow-y-auto bg-slate-50"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave נורה גם במעבר בין אלמנטים פנימיים; בלי הבדיקה הזו
        // המסגרת הכחולה מהבהבת בזמן שגוררים מעל הכרטיסים
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
      <header className="bg-linear-to-bl from-blue-700 via-blue-600 to-violet-600 text-white">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-16">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <BookOpen className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
              <p className="text-sm text-white/70">מחולל לומדות HTML מבוסס בלוקים</p>
            </div>
          </div>

          <p className="mt-8 max-w-2xl text-2xl leading-relaxed font-semibold text-balance">
            בונים לומדה מבלוקים, עורכים אותה על הקנבס, ומקבלים תיקייה שרצה לבד בכל דפדפן.
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            {[
              { icon: WifiOff, text: 'התוצר רץ בלי שרת ובלי אינטרנט' },
              { icon: Languages, text: 'עברית ו-RTL מהיסוד' },
              { icon: Globe, text: 'ZIP להעלאה ל-Moodle' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 text-white/60" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        {/* כרטיס הפרויקטים האחרונים עולה אל תוך פס הגרדיאנט (ה--mt-8 שלו),
            כדי שהמסך ייראה כיחידה אחת. כשאין פרויקטים הוא אינו מרנדר דבר
            והתבניות עולות למעלה מאליהן */}
        <RecentProjects onOpened={onOpened} />

        <section className="mt-10" aria-labelledby="start-heading">
          <h2 id="start-heading" className="text-sm font-bold text-slate-900">
            התחלת לומדה חדשה
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {ready.map((template) => {
              const course = template.create!();
              const blocks = course.chapters.reduce(
                (sum, chapter) => sum + chapter.blocks.length,
                0,
              );

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onStart(template.create!())}
                  className={cn(
                    'group overflow-hidden rounded-2xl border border-slate-200 bg-white text-start transition',
                    'hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg',
                  )}
                >
                  <TemplatePreview course={course} />

                  <span className="block border-t border-slate-100 p-4">
                    <span className="block text-sm font-semibold text-slate-900">
                      {template.name}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                      {template.description}
                    </span>
                    <span className="mt-2 block text-[11px] text-slate-400">
                      {countLabel(course.chapters.length, 'פרק', 'פרקים')} ·{' '}
                      {countLabel(blocks, 'בלוק', 'בלוקים')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {planned.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              בקרוב: {planned.map((template) => template.name).join(' · ')}
            </p>
          )}
        </section>

        <section
          className={cn(
            'mt-8 rounded-2xl border border-dashed p-5 transition',
            dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white/60',
          )}
          aria-labelledby="open-heading"
        >
          <div className="flex items-start gap-3">
            {dragging ? (
              <FileUp className="mt-0.5 size-5 shrink-0 text-blue-500" aria-hidden />
            ) : (
              <FolderOpen className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
            )}

            <div className="min-w-0 flex-1">
              <h2 id="open-heading" className="text-sm font-semibold text-slate-700">
                {dragging ? 'שחררו כאן את הקובץ' : 'המשך מקובץ פרויקט'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                גררו לכאן קובץ ‎.course.zip‎ — לכל מקום במסך — או בחרו אותו ידנית. הקובץ כולל את
                התוכן, העיצוב והתמונות.
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
              >
                {loading ? 'טוען…' : 'בחירת קובץ'}
              </button>

              {fileErrors.length > 0 && (
                <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  {fileErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

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

        <p className="mt-8 text-center text-[11px] text-slate-400">
          {APP_NAME} {APP_VERSION} · הלומדות נשמרות בדפדפן שלכם בלבד ואינן נשלחות לשום שרת
        </p>
      </div>
    </main>
  );
}
