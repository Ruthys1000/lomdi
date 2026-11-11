import { courseIcons } from './icons';

/**
 * מסך הסיום של הלומדה.
 *
 * מופיע כשהלומד מסיים: במצב פרקים כמסך מלא אחרי הפרק האחרון, ובמצב גלילה
 * כרצועה בתחתית. מרכז את ציון השאלות (אם יש), ואם הוגדר ציון מעבר — גם
 * עבר / לא עבר. הטקסטים מקובעים בעברית כמו שאר מחרוזות הרנדרר (`דלג
 * לתוכן`, `ניווט בין פרקים`).
 */

export interface ChapterScore {
  id: string;
  title: string;
  correct: number;
  total: number;
}

interface CompletionSummaryProps {
  correctCount: number;
  totalQuizzes: number;
  /** ציון מעבר באחוזים. חסר או 0 = אין מעבר/כישלון, רק סיכום */
  passScore?: number;
  /** פירוט לפי פרק — מוצג כשיש שאלות ביותר מפרק אחד */
  chapters?: ChapterScore[];
  /** כשמסופק, מוצג כפתור "לחזור ולעיין" (מצב פרקים) */
  onReview?: () => void;
  /** כשמסופק ויש שאלות שלא נענו נכון, מוצג כפתור שמוביל אליהן */
  onReviewMistakes?: () => void;
}

export function CompletionSummary({
  correctCount,
  totalQuizzes,
  passScore,
  chapters = [],
  onReview,
  onReviewMistakes,
}: CompletionSummaryProps) {
  const hasQuizzes = totalQuizzes > 0;
  const percent = hasQuizzes ? Math.round((correctCount / totalQuizzes) * 100) : 100;
  const graded = hasQuizzes && passScore !== undefined && passScore > 0;
  const passed = !graded || percent >= passScore;
  const hasMistakes = hasQuizzes && correctCount < totalQuizzes;
  const breakdown = chapters.filter((chapter) => chapter.total > 0);

  return (
    <div className="lc-completion lc-container" role="status" data-result={passed ? 'pass' : 'fail'}>
      <span className="lc-completion__badge" aria-hidden>
        {passed ? (
          <courseIcons.Award className="lc-completion__icon" />
        ) : (
          <courseIcons.Target className="lc-completion__icon" />
        )}
      </span>
      <h2 className="lc-completion__title">
        {!graded
          ? 'כל הכבוד, סיימת את הלומדה!'
          : passed
            ? 'כל הכבוד, עברת את הלומדה!'
            : 'סיימת את הלומדה, אבל עוד לא עברת'}
      </h2>

      {hasQuizzes ? (
        <p className="lc-completion__score">
          ענית נכון על <strong>{correctCount}</strong> מתוך <strong>{totalQuizzes}</strong>{' '}
          {totalQuizzes === 1 ? 'שאלה' : 'שאלות'}
          {graded ? (
            <>
              {' '}
              — ציון <strong>{percent}%</strong>. ציון המעבר הוא {passScore}%.
            </>
          ) : (
            '.'
          )}
        </p>
      ) : (
        <p className="lc-completion__score">עברת על כל התוכן.</p>
      )}

      {breakdown.length > 1 && (
        <ul className="lc-completion__chapters" aria-label="פירוט לפי פרק">
          {breakdown.map((chapter) => (
            <li key={chapter.id} className="lc-completion__chapter">
              <span className="lc-completion__chapter-title">{chapter.title}</span>
              <span className="lc-completion__chapter-score">
                {chapter.correct} מתוך {chapter.total}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="lc-completion__actions">
        {onReviewMistakes && hasMistakes && (
          <button
            type="button"
            className={`lc-button ${passed ? 'lc-button--ghost' : 'lc-button--primary'}`}
            onClick={onReviewMistakes}
          >
            <courseIcons.Target className="lc-icon" aria-hidden />
            חזרה לשאלות שטעיתי בהן
          </button>
        )}
        {onReview && (
          <button type="button" className="lc-button lc-button--ghost" onClick={onReview}>
            <courseIcons.BookOpen className="lc-icon" aria-hidden />
            לחזור ולעיין
          </button>
        )}
      </div>
    </div>
  );
}
