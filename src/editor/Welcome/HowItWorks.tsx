import { Blocks, PackageCheck, Palette } from 'lucide-react';

/**
 * פס "איך זה עובד" (אונבורדינג).
 *
 * מרונדר רק כשאין עדיין לומדה שמורה, ומי שקורא לו אחראי על התנאי.
 *
 * **בלי מצב שנשמר ובלי כפתור סגירה.** "האם ראיתי את ההסבר" הוא בדיוק סוג
 * הדגל שנשמר ל-localStorage, נשכח, ואז מישהו מגלה שאי אפשר להחזיר אותו.
 * קיום הלומדה הראשונה הוא כבר הסימן שההסבר מיותר — הוא נעלם מעצמו, וחוזר
 * מעצמו אם מוחקים הכול.
 */

const STEPS = [
  {
    icon: Blocks,
    title: 'מרכיבים',
    text: 'גוררים בלוקים: טקסט, תמונה, שאלה.',
  },
  {
    icon: Palette,
    title: 'מעצבים',
    text: 'בוחרים ערכה, והכל מתיישר.',
  },
  {
    icon: PackageCheck,
    title: 'מוציאים',
    text: 'ZIP שנפתח בכל דפדפן.',
  },
];

export function HowItWorks() {
  return (
    <section className="mt-10" aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-base font-bold text-fg">
        איך זה עובד
      </h2>

      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <li
            key={title}
            className="rounded-2xl border border-edge bg-panel p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-volt-soft text-volt-ink">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <span className="text-sm font-bold text-fg">
                {/* המספר נשאר טקסט ולא ::before, כדי שקורא מסך יקריא
                    "1 מרכיבים" ולא רק "מרכיבים" */}
                <span className="text-fg-muted">{index + 1}</span> {title}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-fg-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
