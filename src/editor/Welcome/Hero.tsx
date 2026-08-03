import { useState } from 'react';
import { Check } from 'lucide-react';
import { getFormat, type FormatDefinition, type FormatId } from '@/formats';
import { FormatGallery } from './FormatGallery';
import { GenerateForm } from './GenerateForm';

/**
 * ה-Hero של מסך הפתיחה — ובחירת הפורמט עצמה.
 *
 * שתי החלטות עיצוב:
 *
 * 1. **ה-Hero הוא הפס הכהה.** הכלי הוא "פס עליון כהה מעל אזור עבודה בהיר";
 *    כאן הפס נמתח למסך שלם, והגוף שמתחתיו חוזר לבהיר. זו זהות המוצר.
 * 2. **הבחירה קודמת לתוכן.** מאז הפיבוט לפורמטים, הפעולה הראשונה היא *לבחור
 *    סוג של דף* — ורק אז להדביק תוכן. הגלריה יושבת בלב ה-Hero; בחירת פורמט
 *    מחליפה אותה בטופס היצירה המותאם. בניית דף ריק נשארת כפעולה משנית.
 */

const PROOF = ['בלי התקנה', 'העריכה נשמרת בדפדפן', 'מוכן ל-Moodle'];

interface HeroProps {
  /** בונה דף ריק (תבנית blank) — הפעולה המשנית */
  onBuild: () => void;
}

export function Hero({ onBuild }: HeroProps) {
  const [selected, setSelected] = useState<FormatDefinition | null>(null);

  const pick = (id: FormatId) => setSelected(getFormat(id) ?? null);

  return (
    <section className="relative z-[2] overflow-hidden bg-shell text-shell-fg shadow-[0_22px_40px_-26px_rgba(9,11,15,0.55)]">
      {/* זוהר הדגש */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 start-[-12%] size-[640px] rounded-full bg-volt/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-14 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.08em] text-volt uppercase">
            lomdiAI · פיצוח תוכן ללמידה
          </p>

          <h1 className="mt-4 text-4xl leading-[1.06] font-extrabold tracking-tight text-balance md:text-5xl">
            בחרו <span className="text-volt">פורמט</span>, והדביקו תוכן.
          </h1>

          <p className="mt-4 max-w-[46ch] leading-relaxed text-shell-muted md:text-lg">
            לא עוד "עמוד גנרי". בוחרים איזה סוג של דף רוצים ליצור, וה‑AI מפצח את התוכן ובונה טיוטה
            מותאמת. אחר כך עורכים הכול.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2.5">
            {PROOF.map((text) => (
              <li
                key={text}
                className="inline-flex items-center gap-1.5 rounded-full border border-shell-edge bg-shell-2 px-3 py-1.5 text-xs font-semibold"
              >
                <Check className="size-3.5 text-volt" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          {selected ? (
            <div className="mx-auto max-w-2xl">
              <GenerateForm format={selected} onBack={() => setSelected(null)} tone="dark" />
            </div>
          ) : (
            <FormatGallery onSelect={pick} />
          )}
        </div>

        {!selected && (
          <p className="mt-8 text-sm text-shell-muted">
            מעדיפים לבנות ידנית?{' '}
            <button
              type="button"
              onClick={onBuild}
              className="font-bold text-volt underline-offset-4 transition hover:underline"
            >
              התחילו מדף ריק
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
