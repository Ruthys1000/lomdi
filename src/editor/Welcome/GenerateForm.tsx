import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import {
  generateCourseFromText,
  type GenerateProgressStage,
} from '@/ai/generateCourse';
import type { FormatDefinition } from '@/formats';
import { cn } from '@/lib/cn';
import { openCourse } from '@/persistence/session';
import { toast } from '@/state/toastStore';
import { BackToGallery } from './FormatGallery';
import { useWakeLock } from './useWakeLock';

/**
 * טופס היצירה מ‑AI — הדבקת תוכן → דף בפורמט שנבחר, שנפתח בעורך.
 *
 * הפורמט (שנבחר בגלריה) נשלח לשרת כדי לבחור את "האישיות" של הפרומפט,
 * ומוזרק ל‑`Course.format` כדי שהעורך יחיל את אילוצי הפורמט. תמונות אינן
 * נוצרות: כל בלוק תמונה נשאר עם placeholder ופרומפט מומלץ להעתקה.
 *
 * `tone` קובע רק סגנון: `dark` לשילוב ברקע כהה, `light` לרקע בהיר.
 */
interface GenerateFormProps {
  format: FormatDefinition;
  onBack: () => void;
  tone?: 'dark' | 'light';
}

/** אמצע טווח 2–3 דקות — בסיס לבר ההתקדמות (לא מגיע ל־100% עד שהתוצאה מגיעה). */
const EXPECTED_SECONDS = 150;

const WAIT_STEPS = [
  { id: 'read', label: 'קוראים ומבינים את התוכן', afterSec: 0 },
  { id: 'structure', label: 'בונים את מבנה הדף', afterSec: 25 },
  { id: 'write', label: 'כותבים תוכן לכל בלוק', afterSec: 55 },
  { id: 'polish', label: 'מלטשים ומסיימים', afterSec: 110 },
] as const;

const STATUS_LINES = [
  { afterSec: 0, text: 'מפצחים את התוכן ומארגנים פרקים…' },
  { afterSec: 20, text: 'בונים את שלד הדף לפי הפורמט…' },
  { afterSec: 45, text: 'כותבים מלל עשיר לכל בלוק…' },
  { afterSec: 80, text: 'מכינים פרומפטים לתמונות…' },
  { afterSec: 120, text: 'עוד רגע — לומדות איכותיות לוקחות זמן…' },
  { afterSec: 180, text: 'כמעט שם — ממשיכים ללטש…' },
] as const;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** בר התקדמות לפי זמן — מתקרב ל־90% סביב 2.5 דקות, בלי להגיע לסיום. */
export function estimateProgressPercent(elapsedSec: number): number {
  const t = Math.min(1, Math.max(0, elapsedSec) / EXPECTED_SECONDS);
  return Math.round((1 - (1 - t) ** 1.35) * 90);
}

function statusLineFor(elapsedSec: number, stage: GenerateProgressStage | null): string {
  if (stage === 'retrying') return 'מדייקים את התוצאה — מנסים שוב…';
  let text = STATUS_LINES[0].text;
  for (const line of STATUS_LINES) {
    if (elapsedSec >= line.afterSec) text = line.text;
  }
  return text;
}

function activeStepIndex(elapsedSec: number): number {
  let index = 0;
  for (let i = 0; i < WAIT_STEPS.length; i += 1) {
    if (elapsedSec >= WAIT_STEPS[i].afterSec) index = i;
  }
  return index;
}

export function GenerateForm({ format, onBack, tone = 'light' }: GenerateFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [serverStage, setServerStage] = useState<GenerateProgressStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dark = tone === 'dark';

  // משאיר את המסך דולק בזמן היצירה — נעילת מסך בנייד מנתקת את ה-stream.
  useWakeLock(loading);

  // מונה שניות חי בזמן היצירה — כדי שההמתנה הארוכה תיראה פעילה, לא תקועה.
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const generate = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setServerStage(null);

    try {
      const { course, warnings } = await generateCourseFromText(trimmed, {
        format: format.id,
        onProgress: (info) => {
          if (info?.stage) setServerStage(info.stage);
        },
      });

      // openCourse מחליף את מסך הפתיחה בעורך — הרכיב הזה יתפרק, ולכן אין setState אחריו
      await openCourse(course);

      toast(
        warnings.length ? `הדף נוצר, עם ${warnings.length} התאמות אוטומטיות.` : 'הדף נוצר.',
        { tone: 'success' },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הדף נכשלה.');
      setLoading(false);
      setServerStage(null);
    }
  };

  const progress = estimateProgressPercent(elapsed);
  const stepIndex = activeStepIndex(elapsed);
  const statusText = statusLineFor(elapsed, serverStage);

  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        dark ? 'border-shell-edge bg-shell-2' : 'border-edge-strong bg-panel md:p-6',
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-xs font-semibold', dark ? 'text-volt' : 'text-volt-ink')}>
            פורמט נבחר
          </p>
          <p className={cn('truncate text-sm font-bold', dark ? 'text-shell-fg' : 'text-fg')}>
            {format.label}
          </p>
        </div>
        {!loading && <BackToGallery onBack={onBack} />}
      </div>

      <label htmlFor="generate-input" className="sr-only">
        התוכן שממנו ייווצר הדף
      </label>
      <textarea
        id="generate-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={loading}
        rows={loading ? 3 : 6}
        dir="auto"
        placeholder={format.entryPlaceholder}
        className={cn(
          'w-full resize-y rounded-xl border p-4 text-sm leading-relaxed focus:outline-none disabled:opacity-60',
          dark
            ? 'border-shell-edge bg-shell text-shell-fg placeholder:text-shell-muted focus:border-volt'
            : 'border-edge-strong bg-app text-fg placeholder:text-fg-muted focus:border-volt-dim',
        )}
      />

      {!loading && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={!text.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-3 font-extrabold text-on-volt transition hover:bg-volt-bright disabled:opacity-70"
          >
            <Sparkles className="size-4.5" aria-hidden />
            {`צרו ${format.label}`}
          </button>
        </div>
      )}

      {loading && (
        <div
          className={cn(
            'lc-generate-wait mt-5 rounded-2xl border p-5 md:p-6',
            dark ? 'border-shell-edge bg-shell' : 'border-edge bg-app',
          )}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-start">
            <div className="lc-generate-wait__orb" aria-hidden>
              <span className="lc-generate-wait__orb-ring" />
              <span className="lc-generate-wait__orb-ring lc-generate-wait__orb-ring--delayed" />
              <Sparkles className="lc-generate-wait__orb-icon size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-lg font-extrabold tracking-tight',
                  dark ? 'text-shell-fg' : 'text-fg',
                )}
              >
                יוצרים את הלומדה…
              </p>
              <p
                className={cn(
                  'mt-1 text-sm leading-relaxed',
                  dark ? 'text-shell-muted' : 'text-fg-muted',
                )}
              >
                {statusText}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div
              className={cn(
                'lc-generate-wait__track h-2.5 overflow-hidden rounded-full',
                dark ? 'bg-shell-2' : 'bg-panel',
              )}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="התקדמות משוערת"
            >
              <div
                className="lc-generate-wait__fill h-full rounded-full bg-volt"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div
              className={cn(
                'mt-2 flex flex-wrap items-baseline justify-between gap-2 text-xs tabular-nums',
                dark ? 'text-shell-muted' : 'text-fg-muted',
              )}
            >
              <span>
                עברו {formatElapsed(elapsed)}
                {elapsed >= 60 ? '' : ' · התחלה'}
              </span>
              <span>בדרך כלל 2–3 דקות</span>
            </div>
          </div>

          <ol className="mt-5 grid gap-2 text-start">
            {WAIT_STEPS.map((step, index) => {
              const done = index < stepIndex;
              const active = index === stepIndex;
              return (
                <li
                  key={step.id}
                  className={cn(
                    'flex items-center gap-2.5 text-sm',
                    done && (dark ? 'text-volt' : 'text-volt-ink'),
                    active && (dark ? 'font-semibold text-shell-fg' : 'font-semibold text-fg'),
                    !done && !active && (dark ? 'text-shell-muted' : 'text-fg-muted'),
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px]',
                      done && 'border-volt-dim bg-volt text-on-volt',
                      active && !done && 'border-volt-dim bg-volt-soft text-volt-ink',
                      !done &&
                        !active &&
                        (dark ? 'border-shell-edge bg-shell-2' : 'border-edge bg-panel'),
                    )}
                    aria-hidden
                  >
                    {done ? (
                      <Check className="size-3.5 stroke-[3]" />
                    ) : active ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {step.label}
                </li>
              );
            })}
          </ol>

          <p
            className={cn(
              'mt-5 text-xs leading-relaxed',
              dark ? 'text-shell-muted' : 'text-fg-muted',
            )}
            role="note"
          >
            כדאי להשאיר את המסך פתוח — יציאה או נעילה עלולות לנתק את היצירה.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
