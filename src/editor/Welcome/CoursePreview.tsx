/**
 * ויזואל ה-Hero — מיני-לומדה סטטית שממחישה את התוצר.
 *
 * לא רנדרר חי ולא כרטיסים: מישור ויזואלי אחד שמראה Hero + צ׳ק-ליסט +
 * callout, כדי שהנחיתה תיראה כמו מוצר לומדות ולא כמו גלריית תבניות.
 */
export function CoursePreview() {
  return (
    <div className="lc-landing-preview" aria-hidden>
      <div className="lc-landing-preview__sheet">
        <div className="lc-landing-preview__hero">
          <p className="lc-landing-preview__eyebrow">לומדה קצרה · 6 דקות</p>
          <p className="lc-landing-preview__title">מודל אפר״ת</p>
          <p className="lc-landing-preview__sub">איך עוצרים תגובה אוטומטית בשטח</p>
        </div>

        <div className="lc-landing-preview__body">
          <div className="lc-landing-preview__row" data-done>
            <span className="lc-landing-preview__check" />
            <span>
              <strong>עצירה</strong>
              <em>לפני שמגיבים — נושמים פעם אחת</em>
            </span>
          </div>
          <div className="lc-landing-preview__row">
            <span className="lc-landing-preview__check" />
            <span>
              <strong>פירוש</strong>
              <em>מה קרה באמת, בלי הסיפור שרץ בראש</em>
            </span>
          </div>
          <div className="lc-landing-preview__row">
            <span className="lc-landing-preview__check" />
            <span>
              <strong>תגובה</strong>
              <em>בחירה מודעת במקום רפלקס</em>
            </span>
          </div>

          <div className="lc-landing-preview__callout">
            <span className="lc-landing-preview__callout-mark" />
            <span>
              <strong>העיקר</strong>
              המודל לא מבטל רגש — הוא נותן לו מקום בלי שינהג.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
