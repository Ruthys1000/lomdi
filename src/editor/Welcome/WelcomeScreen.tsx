import { useRef, useState } from 'react';
import { BookOpen, FolderOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { openProjectFile } from '@/persistence/session';
import { courseTemplates } from '@/templates';
import type { Course } from '@/model/types';
import { RecentProjects } from './RecentProjects';

interface WelcomeScreenProps {
  onStart: (course: Course) => void;
  /** נקרא כשפרויקט קיים נטען ישירות ל-stores, בלי לעבור דרך onStart */
  onOpened: () => void;
}

/**
 * מסך הפתיחה (סעיף 5).
 *
 * תבניות שעדיין אינן ממומשות מוצגות מושבתות ומסומנות "בקרוב", ולא
 * מוסתרות: כך רואים לאן המוצר הולך בלי להיתקל בכרטיס שנראה עובד ואינו
 * עושה דבר.
 */
export function WelcomeScreen({ onStart, onOpened }: WelcomeScreenProps) {
  const ready = courseTemplates.filter((template) => template.create);
  const planned = courseTemplates.filter((template) => !template.create);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setFileErrors([]);

    const result = await openProjectFile(file);
    setLoading(false);

    if (result.ok) onOpened();
    else setFileErrors(result.errors);
  };

  return (
    <main className="min-h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <BookOpen className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">LearnIt</h1>
            <p className="text-sm text-slate-500">מחולל לומדות HTML מבוסס בלוקים</p>
          </div>
        </div>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-600">
          בנו לומדה מפרקים ובלוקים, ערכו אותה ויזואלית, וייצאו קובץ HTML עצמאי שאפשר להעלות
          למערכת הלמידה או לפתוח ישירות בדפדפן.
        </p>

        <section className="mt-12" aria-labelledby="start-heading">
          <h2 id="start-heading" className="text-sm font-bold text-slate-900">
            התחלת עבודה
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ready.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onStart(template.create!())}
                className={cn(
                  'group rounded-2xl border border-slate-200 bg-white p-5 text-start transition',
                  'hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md',
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <span className="mt-3 block text-sm font-semibold text-slate-900">
                  {template.name}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="more-heading">
          <h2 id="more-heading" className="text-sm font-bold text-slate-900">
            בקרוב
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {planned.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl border border-dashed border-slate-200 p-5"
                aria-disabled="true"
              >
                <span className="block text-sm font-semibold text-slate-400">{template.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                  {template.description}
                </span>
              </div>
            ))}
          </div>
        </section>

        <RecentProjects onOpened={onOpened} />

        <section className="mt-10 rounded-2xl border border-dashed border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <FolderOpen className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-slate-700">פתיחת קובץ פרויקט</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                קובץ ‎.course.zip‎ שנשמר מהמחולל — כולל התוכן, העיצוב והתמונות.
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
      </div>
    </main>
  );
}
