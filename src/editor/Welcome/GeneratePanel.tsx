import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { generateCourseFromText } from '@/ai/generateCourse';
import { resolveImageIntents } from '@/ai/images';
import { openCourse } from '@/persistence/session';
import { toast } from '@/state/toastStore';

/**
 * הדלת ה-AI-first: הדבקת תוכן → לומדה שלמה שנפתחת בעורך.
 *
 * הזרימה מנצלת את כל שכבת ה-AI: הפונקציה המאובטחת מחזירה JSON גולמי,
 * `generateCourseFromText` מריצה אותו דרך הריפוי והליטוש, כוונות התמונה
 * נופלות בינתיים לאיורי מציב-מקום (ה-AI לתמונות יתחבר בהמשך), ו-`openCourse`
 * טוען הכול לעורך — שינוי ה-course ב-store הוא שמחליף את מסך הפתיחה בעורך.
 */
export function GeneratePanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { course, imageIntents, warnings } = await generateCourseFromText(trimmed);

      // בפרוסה הזו התמונות הן איורי מציב-מקום; משמיטים כתובות כדי לא לפנות לרשת
      const intents = imageIntents.map((intent) => ({ ...intent, url: undefined }));
      const { course: withImages, assets } = await resolveImageIntents(course, intents);

      // openCourse מחליף את מסך הפתיחה בעורך — הרכיב הזה יתפרק, ולכן אין setState אחריו
      await openCourse(withImages, assets);
      toast(
        warnings.length
          ? `הלומדה נוצרה, עם ${warnings.length} התאמות אוטומטיות.`
          : 'הלומדה נוצרה.',
        { tone: 'success' },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הלומדה נכשלה.');
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 pt-10" aria-labelledby="generate-heading">
      <div className="rounded-3xl border border-edge-strong bg-panel p-6 md:p-8">
        <div className="flex items-center gap-2 text-volt-ink">
          <Sparkles className="size-5" aria-hidden />
          <h2 id="generate-heading" className="text-lg font-extrabold text-fg md:text-xl">
            צרו לומדה מטקסט
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          הדביקו תוכן — נוהל, מאמר, סיכום — וה-AI יחולל לומדה שלמה. אחר כך אפשר לערוך הכול.
        </p>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={loading}
          rows={7}
          dir="auto"
          placeholder="הדביקו כאן את התוכן שממנו תיווצר הלומדה…"
          className="mt-5 w-full resize-y rounded-2xl border border-edge-strong bg-app p-4 text-sm leading-relaxed text-fg placeholder:text-fg-muted focus:border-volt-dim focus:outline-none disabled:opacity-60"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-3 font-extrabold text-on-volt transition hover:bg-volt-bright disabled:opacity-50"
          >
            <Sparkles className="size-4.5" aria-hidden />
            {loading ? 'מחולל לומדה…' : 'צרו לומדה'}
          </button>
          {loading && (
            <p className="text-sm text-fg-muted" role="status">
              זה עשוי לקחת עד דקה.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
