import { courseIcons } from './icons';

/**
 * מסך הסיום של הלומדה.
 *
 * מופיע כשהלומד מסיים: במצב פרקים כמסך מלא אחרי הפרק האחרון, ובמצב גלילה
 * כרצועה בתחתית. מרכז את ציון השאלות (אם יש) ומזמין לחזור ולעיין. הטקסטים
 * מקובעים בעברית כמו שאר מחרוזות הרנדרר (`דלג לתוכן`, `ניווט בין פרקים`).
 */

interface CompletionSummaryProps {
  correctCount: number;
  totalQuizzes: number;
  /** כשמסופק, מוצג כפתור "לחזור ולעיין" (מצב פרקים) */
  onReview?: () => void;
}

export function CompletionSummary({ correctCount, totalQuizzes, onReview }: CompletionSummaryProps) {
  const hasQuizzes = totalQuizzes > 0;

  return (
    <div className="lc-completion lc-container" role="status">
      <span className="lc-completion__badge" aria-hidden>
        <courseIcons.Award className="lc-completion__icon" />
      </span>
      <h2 className="lc-completion__title">כל הכבוד, סיימת את הלומדה!</h2>

      {hasQuizzes ? (
        <p className="lc-completion__score">
          ענית נכון על <strong>{correctCount}</strong> מתוך <strong>{totalQuizzes}</strong>{' '}
          {totalQuizzes === 1 ? 'שאלה' : 'שאלות'}.
        </p>
      ) : (
        <p className="lc-completion__score">עברת על כל התוכן.</p>
      )}

      {onReview && (
        <button type="button" className="lc-button lc-button--ghost" onClick={onReview}>
          <courseIcons.BookOpen className="lc-icon" aria-hidden />
          לחזור ולעיין
        </button>
      )}
    </div>
  );
}
