import { useEffect, useState } from 'react';
import { ImageIcon, Loader2, Palette, Sparkles } from 'lucide-react';
import { generateCourseFromText } from '@/ai/generateCourse';
import { resolveImageIntents } from '@/ai/images';
import { createGeneratedImageResolver, endpointImageResolver } from '@/ai/imageResolver';
import { cn } from '@/lib/cn';
import { openCourse } from '@/persistence/session';
import { toast } from '@/state/toastStore';
import { useWakeLock } from './useWakeLock';

/**
 * טופס היצירה מ‑AI — הדבקת תוכן → לומדה שלמה שנפתחת בעורך.
 *
 * הלוגיקה מנצלת את כל שכבת ה‑AI: הפונקציה המאובטחת מחזירה JSON גולמי,
 * `generateCourseFromText` מריצה אותו דרך הריפוי והליטוש, ואז כוונות התמונה
 * נפתרות — או לצילומי סטוק (Pexels) או לאיורים שנוצרים ב‑AI לפי ה‑`visualStyle`
 * של הלומדה — ו‑`openCourse` טוען הכול לעורך. שינוי ה‑course ב‑store הוא
 * שמחליף את מסך הפתיחה בעורך.
 *
 * מקור התמונות הוא בחירה של המשתמש: "איורים ב‑AI" (ברירת מחדל) מייצר סט
 * קוהרנטי ללומדה; "צילומי סטוק" חוזר ל‑Pexels. שני המסלולים נצרבים כ‑Blob,
 * ולכן הלומדה המיוצאת נשארת אופליין בשני המקרים.
 *
 * `tone` קובע רק סגנון: `dark` לשילוב בתוך ה‑Hero הכהה, `light` לרקע בהיר.
 */
interface GenerateFormProps {
  tone?: 'dark' | 'light';
}

type ImageSource = 'ai' | 'stock';
type Phase = 'writing' | 'illustrating';

export function GenerateForm({ tone = 'light' }: GenerateFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('writing');
  const [imageSource, setImageSource] = useState<ImageSource>('ai');
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
    setPhase('writing');
    setError(null);

    try {
      const { course, imageIntents, visualStyle, warnings } = await generateCourseFromText(trimmed);

      // התמונות נפתרות אחרי שהטקסט מוכן — מסמנים שלב כדי שהחיווי יסביר את
      // ההמתנה (יצירת איורים ב‑AI אורכת יותר מחיפוש סטוק).
      setPhase('illustrating');

      // משמיטים כתובות שהמודל אולי נתן כדי שלא נפנה לרשת חיצונית ישירות; כל
      // תמונה נפתרת דרך ה‑endpoint שנבחר. כשל → איור מציב‑מקום.
      const intents = imageIntents.map((intent) => ({ ...intent, url: undefined }));
      const resolver =
        imageSource === 'ai' ? createGeneratedImageResolver(visualStyle) : endpointImageResolver;
      const { course: withImages, assets, providerError } = await resolveImageIntents(
        course,
        intents,
        { resolver },
      );

      // openCourse מחליף את מסך הפתיחה בעורך — הרכיב הזה יתפרק, ולכן אין setState אחריו
      await openCourse(withImages, assets);

      // רק כשל אקציוני (מפתח שגוי/חסר, חריגת מכסה, ספק לא זמין) מצדיק התראה
      // בולטת ומתמשכת — שם באמת יש מה לתקן. תמונה בודדת ש"לא נמצאה" מקבלת
      // placeholder מכובד ולא מדליקה באנר אדום מבהיל על לא-כלום.
      if (providerError) {
        toast(`הלומדה נוצרה, אך התמונות לא נטענו: ${providerError}`, {
          tone: 'error',
          durable: true,
        });
      } else {
        toast(
          warnings.length
            ? `הלומדה נוצרה, עם ${warnings.length} התאמות אוטומטיות.`
            : 'הלומדה נוצרה.',
          { tone: 'success' },
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הלומדה נכשלה.');
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
      <label htmlFor="generate-input" className="sr-only">
        התוכן שממנו תיווצר הלומדה
      </label>
      <textarea
        id="generate-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={loading}
        rows={6}
        dir="auto"
        placeholder="הדביקו כאן תוכן — נוהל, מאמר, סיכום — והמערכת תחולל ממנו לומדה…"
        className={cn(
          'w-full resize-y rounded-xl border p-4 text-sm leading-relaxed focus:outline-none disabled:opacity-60',
          dark
            ? 'border-shell-edge bg-shell text-shell-fg placeholder:text-shell-muted focus:border-volt'
            : 'border-edge-strong bg-app text-fg placeholder:text-fg-muted focus:border-volt-dim',
        )}
      />

      <div className="mt-4">
        <span
          id="image-source-label"
          className={cn('mb-2 block text-xs font-semibold', dark ? 'text-shell-muted' : 'text-fg-muted')}
        >
          מקור התמונות
        </span>
        <div
          role="radiogroup"
          aria-labelledby="image-source-label"
          className={cn(
            'inline-flex gap-1 rounded-xl border p-1',
            dark ? 'border-shell-edge bg-shell' : 'border-edge-strong bg-app',
          )}
        >
          {([
            { id: 'ai', label: 'איורים ב‑AI', Icon: Palette },
            { id: 'stock', label: 'צילומי סטוק', Icon: ImageIcon },
          ] as const).map(({ id, label, Icon }) => {
            const active = imageSource === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setImageSource(id)}
                disabled={loading}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-60',
                  active
                    ? 'bg-volt text-on-volt'
                    : dark
                      ? 'text-shell-muted hover:text-shell-fg'
                      : 'text-fg-muted hover:text-fg',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
        <p className={cn('mt-1.5 text-xs', dark ? 'text-shell-muted' : 'text-fg-muted')}>
          {imageSource === 'ai'
            ? 'סט איורים ייחודי שנוצר ללומדה — קוהרנטי ותואם לערכה. איטי יותר מסטוק.'
            : 'צילומי מלאי אמיתיים מ‑Pexels — מהיר יותר.'}
        </p>
      </div>

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
          {loading ? 'מחולל לומדה…' : 'צרו לומדה'}
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
            {phase === 'writing' ? 'ה‑AI כותב את הלומדה' : 'ה‑AI מאייר את הלומדה'} —{' '}
            {elapsed > 0 ? `כבר ${elapsed} שניות…` : 'רגע…'}
          </p>
        )}
      </div>

      {loading && (
        <p
          className={cn('mt-3 text-xs', dark ? 'text-shell-muted' : 'text-fg-muted')}
          role="note"
        >
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
