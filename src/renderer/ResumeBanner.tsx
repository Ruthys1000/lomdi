import { courseIcons } from './icons';

/**
 * "ממשיכים מאיפה שעצרת" — מוצג ללומד שחוזר ללומדה עם התקדמות שמורה.
 *
 * בלי ההודעה הזו החזרה לפרק 3 נראית כמו תקלה ("למה זה לא מתחיל מההתחלה?"),
 * ואין ללומד דרך להתחיל מחדש. הטקסטים מקובעים בעברית כמו שאר מחרוזות
 * הרנדרר (`דלג לתוכן`, מסך הסיום).
 */
interface ResumeBannerProps {
  /** תיאור המקום שממנו ממשיכים, למשל "פרק 3: עקרונות". חסר במצב גלילה */
  location?: string;
  onRestart: () => void;
  onDismiss: () => void;
}

export function ResumeBanner({ location, onRestart, onDismiss }: ResumeBannerProps) {
  return (
    <div className="lc-resume" role="status">
      <div className="lc-container lc-resume__inner">
        <courseIcons.BookOpen className="lc-icon lc-resume__icon" aria-hidden />
        <p className="lc-resume__text">
          <strong>ברוכים השבים.</strong>{' '}
          {location ? `ממשיכים מ${location}.` : 'התשובות שלך מהפעם הקודמת נשמרו.'}
        </p>
        <button type="button" className="lc-resume__action" onClick={onRestart}>
          להתחיל מחדש
        </button>
        <button
          type="button"
          className="lc-resume__close"
          aria-label="סגירת ההודעה"
          onClick={onDismiss}
        >
          <courseIcons.X className="lc-icon" aria-hidden />
        </button>
      </div>
    </div>
  );
}
