import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { generateCourseFromText } from '@/ai/generateCourse';
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

export function GenerateForm({ format, onBack, tone = 'light' }: GenerateFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
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

    try {
      const { course, warnings } = await generateCourseFromText(trimmed, { format: format.id });

      // openCourse מחליף את מסך הפתיחה בעורך — הרכיב הזה יתפרק, ולכן אין setState אחריו
      await openCourse(course);

      toast(
        warnings.length ? `הדף נוצר, עם ${warnings.length} התאמות אוטומטיות.` : 'הדף נוצר.',
        { tone: 'success' },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הדף נכשלה.');
      setLoading(false);
    }
  };

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
        rows={6}
        dir="auto"
        placeholder={format.entryPlaceholder}
        className={cn(
          'w-full resize-y rounded-xl border p-4 text-sm leading-relaxed focus:outline-none disabled:opacity-60',
          dark
            ? 'border-shell-edge bg-shell text-shell-fg placeholder:text-shell-muted focus:border-volt'
            : 'border-edge-strong bg-app text-fg placeholder:text-fg-muted focus:border-volt-dim',
        )}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-3 font-extrabold text-on-volt transition hover:bg-volt-bright disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="size-4.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4.5" aria-hidden />
          )}
          {loading ? 'מחולל דף…' : `צרו ${format.label}`}
        </button>
        {loading && (
          <p
            className={cn(
              'inline-flex items-center gap-2 text-sm',
              dark ? 'text-shell-muted' : 'text-fg-muted',
            )}
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            ה‑AI מפצח את התוכן — {elapsed > 0 ? `כבר ${elapsed} שניות…` : 'רגע…'}
          </p>
        )}
      </div>

      {loading && (
        <p className={cn('mt-3 text-xs', dark ? 'text-shell-muted' : 'text-fg-muted')} role="note">
          היצירה עשויה להימשך עד כדקה. כדאי להשאיר את המסך פתוח — יציאה מהמסך עלולה לנתק.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
