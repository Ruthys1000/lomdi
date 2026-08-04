import { ArrowDown, Sparkles } from 'lucide-react';
import { APP_BRAND } from '@/version';
import { CoursePreview } from './CoursePreview';

/**
 * Hero הנחיתה — קומפוזיציה אחת.
 *
 * המותג הוא האות הראשית (לא רק כיתוב ב-nav). מתחתיו משפט אחד, CTA ראשי
 * ליצירה עם AI, ו-CTA משני לדף ריק. מימין/מתחת — ויזואל תוצר מלא, בלי
 * כרטיסי פורמט, בלי proof pills, ובלי תגיות צפות על התמונה.
 *
 * רקע בהיר בכוונה: שחור+מנטה על הנחיתה הרגיש חד מדי לסביבת יצירת לומדות.
 */

interface HeroProps {
  /** גולל לגלריית הפורמטים — הפעולה הראשית */
  onCreateAi: () => void;
  /** בונה דף ריק — הפעולה המשנית */
  onBuild: () => void;
}

export function Hero({ onCreateAi, onBuild }: HeroProps) {
  return (
    <section className="lc-landing-hero relative overflow-hidden text-fg">
      <div aria-hidden className="lc-landing-hero__atmosphere" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:py-16 lg:py-20">
        <div className="lc-landing-hero__copy relative z-[1] max-w-xl">
          <p className="lc-landing-brand">{APP_BRAND}</p>

          <h1 className="mt-4 text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-4xl md:text-[2.75rem] lg:text-5xl">
            מטקסט ללומדה.
          </h1>

          <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-fg-muted md:text-lg">
            בחרו פורמט, הדביקו תוכן — וה‑AI בונה טיוטה שאפשר לערוך מיד.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreateAi}
              className="inline-flex items-center gap-2 rounded-xl bg-volt-ink px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0d7a6c] sm:px-6 sm:text-base"
            >
              <Sparkles className="size-4.5" aria-hidden />
              צרו עם AI
              <ArrowDown className="size-4 opacity-80" aria-hidden />
            </button>

            <button
              type="button"
              onClick={onBuild}
              className="rounded-xl border border-edge-strong bg-field/70 px-5 py-3 text-sm font-semibold text-fg transition hover:border-volt-ink hover:text-volt-ink sm:text-base"
            >
              התחילו מדף ריק
            </button>
          </div>
        </div>

        <div className="lc-landing-hero__visual relative z-[1] min-w-0">
          <CoursePreview />
        </div>
      </div>
    </section>
  );
}
