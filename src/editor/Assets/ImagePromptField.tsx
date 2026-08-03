import { useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * שדה "פרומפט מומלץ לתמונה".
 *
 * Lomdi לא מייצר תמונות — הבלוק נשאר עם placeholder. במקום זה ה-AI מציע
 * פרומפט (באנגלית) שהמשתמש יכול להעתיק למחולל תמונות משלו (Midjourney,
 * DALL·E, Gemini וכו'). השדה ניתן לעריכה, וכפתור ההעתקה מקצר את הדרך.
 */
export function ImagePromptField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // דפדפן ללא הרשאת clipboard — המשתמש עדיין יכול לסמן ולהעתיק ידנית
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-fg-soft">
          פרומפט מומלץ לתמונה
        </label>
        {value?.trim() && (
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1 rounded-md border border-edge px-1.5 py-0.5 text-[11px] font-semibold text-fg-muted transition hover:border-volt-dim hover:text-volt-ink"
          >
            {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
            {copied ? 'הועתק' : 'העתקה'}
          </button>
        )}
      </div>
      <textarea
        id={id}
        rows={3}
        value={value ?? ''}
        dir="ltr"
        placeholder="cinematic still of… / watercolor sketch of… / isometric diorama…"
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full resize-y rounded-lg border border-edge bg-field px-2.5 py-1.5 text-start text-sm text-fg placeholder:text-fg-muted focus:border-volt-dim focus:ring-1 focus:ring-volt-dim focus:outline-none',
        )}
      />
      <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
        העתיקו את הפרומפט למחולל תמונות (למשל Midjourney, DALL·E, Gemini), ואז העלו את התמונה
        שיצרתם דרך "קובץ התמונה" למעלה.
      </p>
    </div>
  );
}
