import { Check } from 'lucide-react';
import { GenerateForm } from './GenerateForm';

/**
 * ה-Hero של מסך הפתיחה — ומחולל הלומדות עצמו.
 *
 * שלוש החלטות עיצוב:
 *
 * 1. **ה-Hero הוא הפס הכהה.** הכלי הוא "פס עליון כהה מעל אזור עבודה בהיר";
 *    כאן הפס נמתח למסך שלם, והגוף שמתחתיו חוזר לבהיר. זו זהות המוצר.
 * 2. **הקלט הוא הגיבור.** מאז המעבר ל-AI-first, הפעולה הראשית היא "הדביקו טקסט
 *    → קבלו לומדה", ולכן טופס היצירה (`GenerateForm`) יושב בלב ה-Hero במקום
 *    ויזואל דקורטיבי. בניית לומדה מאפס נשארת כפעולה משנית.
 * 3. **הוכחה כנה, לא מזויפת.** אין לוגואים ולא עדויות — ההוכחה היא הבטחות
 *    יכולת ואפס-חיכוך.
 */

const PROOF = ['בלי התקנה', 'העריכה נשמרת בדפדפן', 'מוכן ל-Moodle'];

interface HeroProps {
  /** בונה לומדה ריקה (תבנית blank) — הפעולה המשנית */
  onBuild: () => void;
}

export function Hero({ onBuild }: HeroProps) {
  return (
    <section className="relative z-[2] overflow-hidden bg-shell text-shell-fg shadow-[0_22px_40px_-26px_rgba(9,11,15,0.55)]">
      {/* זוהר הדגש מאחורי הטופס */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 start-[-12%] size-[640px] rounded-full bg-volt/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-6 py-14 md:grid-cols-[1fr_1fr] md:gap-14 md:py-20">
        <div>
          <p className="text-xs font-bold tracking-[0.08em] text-volt uppercase">
            lomdiAI · יצירת לומדות ב-AI
          </p>

          <h1 className="mt-4 text-4xl leading-[1.06] font-extrabold tracking-tight text-balance md:text-5xl">
            הפכו כל טקסט ל<span className="text-volt">לומדה</span>.
          </h1>

          <p className="mt-4 max-w-[34ch] leading-relaxed text-shell-muted md:text-lg">
            הדביקו תוכן — נוהל, מאמר, סיכום — והמערכת מחוללת לומדה שלמה ומעוצבת. אחר כך עורכים הכול.
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

          <p className="mt-6 text-sm text-shell-muted">
            מעדיפים לבנות ידנית?{' '}
            <button
              type="button"
              onClick={onBuild}
              className="font-bold text-volt underline-offset-4 transition hover:underline"
            >
              התחילו מלומדה ריקה
            </button>
          </p>
        </div>

        {/* הגיבור: טופס היצירה, מעוצב לרקע הכהה */}
        <GenerateForm tone="dark" />
      </div>
    </section>
  );
}
