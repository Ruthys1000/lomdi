import { PackageCheck, PencilRuler, Route } from 'lucide-react';

/**
 * רצועת הערך — מה מקבלים, בשלוש שורות.
 *
 * לא "איך זה עובד" (שלבים) ולא proof pills על ה-Hero: שלוש תוצאות קונקרטיות
 * שמסבירות למה הכלי שונה ממחולל שקפים. יושבת בין ה-Hero לגלריה, כדי שמי
 * שגולל לבחירת פורמט כבר יודע מה ייצא לו ביד.
 */

const values = [
  {
    icon: Route,
    title: 'תהליך למידה, לא רק עמוד',
    text: 'פרקים שנפתחים בזה אחר זה, שאלות בדרך וציון מעבר. הלומד חוזר בדיוק לנקודה שבה עצר.',
  },
  {
    icon: PencilRuler,
    title: 'טיוטה שנשארת שלכם',
    text: 'ה‑AI בונה את השלד מהחומר שלכם בלבד. כל כותרת, שאלה ותמונה ניתנות לעריכה ישירות על המסך.',
  },
  {
    icon: PackageCheck,
    title: 'קובץ אחד שעובד בכל מקום',
    text: 'ייצוא ל‑HTML עצמאי שנפתח בלי שרת, או לחבילת SCORM שמדווחת ל‑Moodle ציון והתקדמות.',
  },
];

export function ValueBand() {
  return (
    <section className="border-y border-edge bg-panel" aria-label="מה מקבלים">
      <ul className="mx-auto grid max-w-6xl gap-x-10 gap-y-7 px-6 py-10 md:grid-cols-3 md:py-12">
        {values.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-volt-soft text-volt-ink">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] leading-snug font-bold text-fg">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
