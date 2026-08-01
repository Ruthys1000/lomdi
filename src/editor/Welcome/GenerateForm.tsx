import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { generateCourseFromText } from '@/ai/generateCourse';
import { resolveImageIntents } from '@/ai/images';
import { cn } from '@/lib/cn';
import { openCourse } from '@/persistence/session';
import { toast } from '@/state/toastStore';

/**
 * טופס היצירה מ‑AI — הדבקת תוכן → לומדה שלמה שנפתחת בעורך.
 *
 * הלוגיקה מנצלת את כל שכבת ה‑AI: הפונקציה המאובטחת מחזירה JSON גולמי,
 * `generateCourseFromText` מריצה אותו דרך הריפוי והליטוש, כוונות התמונה נופלות
 * בינתיים לאיורי מציב‑מקום (ה‑AI לתמונות יתחבר בהמשך), ו‑`openCourse` טוען
 * הכול לעורך — שינוי ה‑course ב‑store הוא שמחליף את מסך הפתיחה בעורך.
 *
 * `tone` קובע רק סגנון: `dark` לשילוב בתוך ה‑Hero הכהה, `light` לרקע בהיר.
 */
interface GenerateFormProps {
  tone?: 'dark' | 'light';
}

export function GenerateForm({ tone = 'light' }: GenerateFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dark = tone === 'dark';

  const generate = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const { course, imageIntents, warnings } = await generateCourseFromText(trimmed);

      // בפרוסה הזו התמונות הן איורי מציב‑מקום; משמיטים כתובות כדי לא לפנות לרשת
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
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
          <p className={cn('text-sm', dark ? 'text-shell-muted' : 'text-fg-muted')} role="status">
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
  );
}
