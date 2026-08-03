import { useId, useState } from 'react';
import type { BlockOf } from '@/model/types';
import { courseIcons } from '@/renderer/icons';
import { useRenderContext } from '@/renderer/RenderContext';
import type { ChallengeContent, ChallengeQuestion } from './content';

// מוגדר כאן ולא מיובא מ-content.ts: ייבוא ערך (לא-טיפוס) מ-content היה גורר את
// zod לחבילת ה-runtime ושובר את גבול הרנדרר.
const correctOptionId = (question: ChallengeQuestion): string | undefined =>
  question.options.find((option) => option.correct)?.id;

/**
 * "בחן את עצמך" — סדרת שאלות עם ציון.
 *
 * אינטראקטיבי בתצוגה המקדימה ובתוצר. הלומד עונה על כל השאלות, לוחץ "בדיקה",
 * ומקבל ציון ומשוב מעבר/כישלון + סימון והסבר לכל שאלה. "ניסיון נוסף" מאפס.
 * בעורך (`isEditing`) הבחירה מושבתת — דפוס quiz.
 */
export function ChallengeRenderer({ block }: { block: BlockOf<ChallengeContent> }) {
  const { content } = block;
  const { isEditing } = useRenderContext();
  const groupId = useId();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const total = content.questions.length;
  const correctCount = content.questions.filter(
    (question) => answers[question.id] && answers[question.id] === correctOptionId(question),
  ).length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = score >= content.passScore;
  const allAnswered = content.questions.every((question) => answers[question.id]);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="lc-container">
      <div className="lc-challenge">
        {content.intro && <p className="lc-challenge__intro">{content.intro}</p>}

        <ol className="lc-challenge__questions">
          {content.questions.map((question, index) => {
            const answerId = answers[question.id];
            const correctId = correctOptionId(question);

            return (
              <li key={question.id} className="lc-challenge__question">
                <p className="lc-challenge__prompt">
                  <span className="lc-challenge__num" aria-hidden>
                    {index + 1}
                  </span>
                  {question.prompt}
                </p>

                <div className="lc-challenge__options">
                  {question.options.map((option) => {
                    const chosen = answerId === option.id;
                    const state = submitted
                      ? option.id === correctId
                        ? 'correct'
                        : chosen
                          ? 'incorrect'
                          : undefined
                      : undefined;

                    return (
                      <label
                        key={option.id}
                        className="lc-challenge__option"
                        data-state={state}
                      >
                        <input
                          type="radio"
                          name={`${groupId}-${question.id}`}
                          value={option.id}
                          checked={chosen}
                          disabled={isEditing || submitted}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [question.id]: option.id }))
                          }
                          className="lc-challenge__radio"
                        />
                        <span className="lc-control lc-control--radio" aria-hidden />
                        <span className="lc-challenge__label">{option.text}</span>
                        {submitted && option.id === correctId && (
                          <courseIcons.Check className="lc-challenge__mark" aria-label="נכונה" />
                        )}
                        {submitted && chosen && option.id !== correctId && (
                          <courseIcons.X className="lc-challenge__mark" aria-label="שגויה" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {submitted && question.explanation && (
                  <p className="lc-challenge__explanation">{question.explanation}</p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="lc-challenge__actions">
          {!submitted ? (
            <button
              type="button"
              className="lc-button lc-button--primary"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
            >
              בדיקה
            </button>
          ) : (
            <button type="button" className="lc-button lc-button--ghost" onClick={reset}>
              ניסיון נוסף
            </button>
          )}
        </div>

        <div className="lc-challenge__result" role="status" aria-live="polite">
          {submitted && (
            <div className="lc-challenge__result-box" data-tone={passed ? 'pass' : 'fail'}>
              <p className="lc-challenge__score">
                {correctCount} מתוך {total} ({score}%)
              </p>
              <p className="lc-challenge__result-text">
                {passed ? content.resultPass : content.resultFail}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
