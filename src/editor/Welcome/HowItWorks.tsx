import { Blocks, PackageCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * פס "איך עובדים עם לומדי" — שלושת השלבים כ"פס ייצור" (סעיף אונבורדינג).
 *
 * מרונדר רק כשאין עדיין לומדה שמורה, ומי שקורא לו אחראי על התנאי.
 *
 * **בלי מצב שנשמר ובלי כפתור סגירה.** "האם ראיתי את ההסבר" הוא בדיוק סוג
 * הדגל שנשמר ל-localStorage, נשכח, ואז מישהו מגלה שאי אפשר להחזיר אותו.
 * קיום הלומדה הראשונה הוא כבר הסימן שההסבר מיותר — הוא נעלם מעצמו, וחוזר
 * מעצמו אם מוחקים הכול.
 *
 * הקו המחבר בין השלבים (`lc-step-line`) חי ב-editor.css: הוא ::after שזורם
 * לפי כיוון הכתיבה, מהמספר אל השלב הבא (משמאל ב-RTL).
 */

const STEPS = [
  {
    icon: Sparkles,
    title: 'מדביקים טקסט',
    text: 'מדביקים תוכן — נוהל, מאמר, סיכום — וה-AI מחולל ממנו לומדה שלמה: פרקים, בלוקים ושאלות תרגול.',
    kbd: 'יצירה ב-AI',
  },
  {
    icon: Blocks,
    title: 'עורכים ומעצבים',
    text: 'משכללים על הקנבס: מוסיפים ומסדרים בלוקים, מחליפים תמונות, ובוחרים ערכת עיצוב — הכול חי.',
    kbd: '11 בלוקים · 8 ערכות',
  },
  {
    icon: PackageCheck,
    title: 'מייצאים ומעבירים',
    text: 'מקבלים קובץ ZIP שנפתח בכל דפדפן, גם אופליין — ל-Moodle, בווטסאפ או מדיסק-און-קי.',
    kbd: '.course.zip',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14" aria-labelledby="how-heading">
      <p className="text-xs font-bold tracking-[0.08em] text-fg-muted uppercase">שלושה שלבים</p>
      <h2 id="how-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
        איך עובדים עם לומדי
      </h2>

      <ol className="mt-8 grid sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text, kbd }, index) => (
          <li key={title} className={cn('relative p-6', index < STEPS.length - 1 && 'lc-step-line')}>
            {/* המספר טקסט ולא ::before, כדי שקורא מסך יקריא "1 מרכיבים" */}
            <span className="flex size-10 items-center justify-center rounded-xl bg-volt-soft text-lg font-extrabold text-volt-ink">
              {index + 1}
            </span>

            <h3 className="mt-4 text-lg font-extrabold text-fg">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{text}</p>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-edge bg-panel px-2.5 py-1.5 text-xs font-bold text-fg-soft">
              <Icon className="size-3.5 text-volt-ink" aria-hidden />
              {/* bdi מבודד ערך לטיני (‎.course.zip‎) כך שלא יתהפך בתוך שורה עברית */}
              <bdi>{kbd}</bdi>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
