import { Check, Plus } from 'lucide-react';

/**
 * ה-Hero של מסך הפתיחה — מוצג למבקר חדש (בלי לומדות שמורות).
 *
 * שלוש החלטות עיצוב:
 *
 * 1. **ה-Hero הוא הפס הכהה.** הכלי כבר "פס עליון כהה מעל אזור עבודה בהיר";
 *    כאן הפס נמתח למסך שלם, והגוף שמתחתיו חוזר לבהיר. זו זהות המוצר, לא
 *    קישוט — ולכן משתמשים ב-shell ולא ברקע חדש.
 * 2. **הוויזואל מספר את הסיפור בלי מילה.** המיני-לומדי מנפיש בלולאה את
 *    המעבר "בונים מבלוקים → מקבלים אתר מעוצב" (ראו MiniLomdi). ה-keyframes
 *    חיים ב-editor.css כי אינם utility של Tailwind.
 * 3. **הוכחה כנה, לא מזויפת.** אין לוגואים ולא עדויות — זה כלי פנימי.
 *    ההוכחה היא הבטחות יכולת ואפס-חיכוך.
 */

const PROOF = ['בלי התקנה', 'נשמר אצלך בדפדפן', 'מוכן ל-Moodle'];

interface HeroProps {
  /** בונה לומדה ריקה (תבנית blank) */
  onBuild: () => void;
  /** פותח את לומדת הדוגמה (תבנית sample) */
  onSample: () => void;
  /** מתחיל ממבנה מוכן (תבנית shortTraining) */
  onShort: () => void;
}

export function Hero({ onBuild, onSample, onShort }: HeroProps) {
  return (
    <section className="relative z-[2] overflow-hidden bg-shell text-shell-fg shadow-[0_22px_40px_-26px_rgba(9,11,15,0.55)]">
      {/* זוהר הדגש מאחורי הוויזואל */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 start-[-12%] size-[640px] rounded-full bg-volt/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-6 py-14 md:grid-cols-[1.05fr_.95fr] md:gap-14 md:py-20">
        <div>
          <p className="text-xs font-bold tracking-[0.08em] text-volt uppercase">
            מחולל לומדות · הכול קורה בדפדפן
          </p>

          <h1 className="mt-4 text-4xl leading-[1.06] font-extrabold tracking-tight text-balance md:text-5xl">
            הופכים חומר הדרכה ל<span className="text-volt">לומדה</span> — בלי לכתוב שורת קוד.
          </h1>

          <p className="mt-4 max-w-[34ch] leading-relaxed text-shell-muted md:text-lg">
            מרכיבים מבלוקים, בוחרים עיצוב, ומייצאים אתר שרץ לבד. הכול בדפדפן — בלי שרת ובלי הרשמה.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={onBuild}
              className="inline-flex items-center gap-2 rounded-xl bg-volt px-7 py-3.5 font-extrabold text-on-volt transition hover:bg-volt-bright"
            >
              <Plus className="size-4.5" aria-hidden />
              מתחילים לבנות
            </button>

            <button
              type="button"
              onClick={onSample}
              className="inline-flex items-center gap-2 rounded-xl border border-shell-edge px-5 py-3 font-semibold text-shell-fg transition hover:border-volt-dim hover:text-volt"
            >
              רואים לומדה לדוגמה
            </button>
          </div>

          <p className="mt-3 text-sm text-shell-muted">
            או{' '}
            <button
              type="button"
              onClick={onShort}
              className="font-semibold text-volt underline underline-offset-2 transition hover:text-volt-bright"
            >
              מתחילים ממבנה מוכן
            </button>
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

        <MiniLomdi />
      </div>
    </section>
  );
}

/**
 * "מיני-לומדי" — מסגרת מכשיר שמנפישה בלולאה של 6.5ש' את המעבר עריכה→ייצוא.
 * דקורטיבי לחלוטין ולכן aria-hidden. כל התנועה עוברת דרך מחלקות `lc-*`
 * שמוגדרות ב-editor.css, ומכבדת `prefers-reduced-motion` (מקפיאה על התוצאה).
 */
function MiniLomdi() {
  return (
    <div className="relative" aria-hidden>
      <div className="relative rounded-[20px] border border-shell-edge bg-[#0e1116] p-3.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]">
        {/* פס הכלי + תגית המצב המתחלפת */}
        <div className="flex items-center gap-2 px-1.5 pt-1 pb-3">
          <span className="size-2.5 rounded-full bg-shell-edge" />
          <span className="size-2.5 rounded-full bg-shell-edge" />
          <span className="size-2.5 rounded-full bg-shell-edge" />
          <span className="ms-auto grid min-w-[118px] rounded-full border border-shell-edge bg-shell-2 px-3 py-1 text-center text-[11px] font-bold">
            <span className="lc-status-edit [grid-area:1/1] whitespace-nowrap text-shell-muted">
              מצב: <b className="text-volt">עריכה</b>
            </span>
            <span className="lc-status-export [grid-area:1/1] whitespace-nowrap text-shell-muted">
              מצב: <b className="text-volt">מיוצא</b>
            </span>
          </span>
        </div>

        <div className="lc-stage overflow-hidden rounded-xl">
          {/* שכבת עריכה — בלוקים נכנסים אחד-אחד */}
          <div className="lc-hero-edit">
            <div className="flex min-h-[236px] flex-col gap-2.5 bg-white p-4">
              <div className="lc-blk-1 rounded-lg border border-[#b6ecdf] bg-volt-soft p-3">
                <div className="h-2.5 w-[70%] rounded bg-volt-dim" />
              </div>
              <div className="lc-blk-2 rounded-lg border border-[#e6e9ee] bg-[#f7f8fa] p-3">
                <div className="h-2.5 rounded bg-[#c9ccd3]" />
                <div className="mt-1.5 h-1.5 w-[55%] rounded bg-[#dfe2e7]" />
              </div>
              <div className="lc-insert h-0.5 rounded bg-volt shadow-[0_0_0_3px_rgba(45,225,194,0.2)]" />
              <div className="lc-blk-3 flex items-center gap-2.5 rounded-lg border border-[#e6e9ee] bg-[#f7f8fa] p-3">
                <div className="h-10 w-14 shrink-0 rounded-md bg-gradient-to-br from-[#dfe6ef] to-[#eef1f5]" />
                <div className="flex-1">
                  <div className="h-2.5 rounded bg-[#c9ccd3]" />
                  <div className="mt-1.5 h-1.5 w-[55%] rounded bg-[#dfe2e7]" />
                </div>
              </div>
            </div>
          </div>

          {/* שכבת לומדה מיוצאת — עמוד נקי ומעוצב */}
          <div className="lc-hero-export">
            <div className="min-h-[236px] bg-white p-4">
              <div className="border-s-4 border-volt ps-3">
                <div className="h-3 w-[64%] rounded-md bg-[#1f2530]" />
                <div className="mt-2 h-2 w-[42%] rounded bg-volt-dim" />
              </div>
              <div className="mt-3.5 h-2 rounded bg-[#e2e5ea]" />
              <div className="mt-2 h-2 w-[78%] rounded bg-[#e2e5ea]" />
              <div className="mt-3.5 h-[66px] rounded-lg border border-[#eceff3] bg-gradient-to-br from-[#e8eef6] to-[#f3f6fa]" />
              <div className="mt-4 flex items-center gap-2">
                <span className="flex gap-1.5">
                  <i className="size-1.5 rounded-full bg-volt-dim" />
                  <i className="size-1.5 rounded-full bg-[#d7dbe1]" />
                  <i className="size-1.5 rounded-full bg-[#d7dbe1]" />
                </span>
                <span className="ms-auto h-5.5 w-16 rounded-md bg-volt" />
              </div>
            </div>
          </div>

          {/* הבזק המעבר */}
          <div className="lc-flash bg-volt" />
        </div>

        {/* צ'יפ הקובץ הצף — מופיע ברגע הייצוא; מוסתר במובייל למניעת גלישה */}
        <div className="lc-filechip absolute end-2.5 bottom-4 z-[3] hidden items-center gap-1.5 rounded-lg border border-[#e6e9ee] bg-white px-2.5 py-2 text-[11.5px] font-extrabold text-[#14181d] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.55)] sm:flex">
          <Check className="size-3.5 text-volt-ink" aria-hidden />
          index.html
        </div>
      </div>
    </div>
  );
}
