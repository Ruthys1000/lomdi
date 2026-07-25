import { useId, useState } from 'react';
import type { BlockOf } from '@/model/types';
import { courseIcons } from '@/renderer/icons';
import { useRenderContext } from '@/renderer/RenderContext';
import type { QuizContent, QuizOption } from './content';

/**
 * שאלת בחירה (סעיף 7.8).
 *
 * אינטראקטיבית גם בתצוגה המקדימה וגם בתוצר המיוצא — אותו רכיב בדיוק,
 * ולכן אין סיכוי שהיא תעבוד באחד ולא באחר.
 *
 * שתי נקודות שנקבעו במפורש:
 *
 * 1. הערבוב מחושב פעם אחת ב-initializer של useState, ולא בזמן רינדור.
 *    ערבוב בזמן רינדור היה מסדר את התשובות מחדש מתחת לאצבע של הלומד בכל
 *    לחיצה. בעריכה אין ערבוב כלל — רשימה שקופצת בכל הקלדה אינה ניתנת
 *    לעריכה.
 * 2. התוצאה אינה מועברת בצבע בלבד (סעיף 18): המשוב הוא טקסט בתוך
 *    role="status", עם אייקון לצדו.
 */
export function QuizRenderer({ block }: { block: BlockOf<QuizContent> }) {
  const { content } = block;
  const { isEditing } = useRenderContext();
  const groupId = useId();

  const [options] = useState(() =>
    content.shuffle && !isEditing ? shuffle(content.options) : content.options,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);

  // בעריכה הרשימה מתעדכנת מיד; אחרי משחק המשתמש הסדר כבר קבוע
  const visibleOptions = isEditing ? content.options : options;

  const selected = visibleOptions.find((option) => option.id === selectedId);
  const isCorrect = Boolean(selected?.correct);
  const canRetry = submitted && !isCorrect && content.allowRetry;

  const reset = () => {
    setSubmitted(false);
    setSelectedId(null);
    setSolutionShown(false);
  };

  return (
    <div className="lc-container">
      <div className="lc-quiz">
        <fieldset className="lc-quiz__fieldset">
          <legend className="lc-quiz__question">{content.question}</legend>
          {content.hint && <p className="lc-quiz__hint">{content.hint}</p>}

          <div className="lc-quiz__options">
            {visibleOptions.map((option) => {
              const revealed = solutionShown || (submitted && option.id === selectedId);

              return (
                <label
                  key={option.id}
                  className="lc-quiz__option"
                  data-state={revealed ? optionState(option, submitted, solutionShown) : undefined}
                >
                  <input
                    type="radio"
                    name={groupId}
                    value={option.id}
                    checked={selectedId === option.id}
                    disabled={submitted && !canRetry}
                    onChange={() => setSelectedId(option.id)}
                    className="lc-quiz__radio"
                  />
                  <span className="lc-quiz__label">{option.text}</span>

                  {/* סימון התשובה — אייקון ולא רק צבע */}
                  {revealed && option.correct && (
                    <courseIcons.Check className="lc-quiz__mark" aria-label="תשובה נכונה" />
                  )}
                  {revealed && !option.correct && option.id === selectedId && (
                    <courseIcons.X className="lc-quiz__mark" aria-label="תשובה שגויה" />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="lc-quiz__actions">
          {!submitted && (
            <button
              type="button"
              className="lc-button lc-button--primary"
              disabled={!selectedId}
              onClick={() => setSubmitted(true)}
            >
              {content.labels.submit}
            </button>
          )}

          {canRetry && (
            <button type="button" className="lc-button lc-button--ghost" onClick={reset}>
              {content.labels.retry}
            </button>
          )}

          {submitted && !isCorrect && content.showSolution && !solutionShown && (
            <button
              type="button"
              className="lc-button lc-button--ghost"
              onClick={() => setSolutionShown(true)}
            >
              {content.labels.solution}
            </button>
          )}
        </div>

        {/* aria-live: הלומד שומע את התוצאה מבלי לחפש אותה על המסך */}
        <div className="lc-quiz__feedback" role="status" aria-live="polite">
          {submitted && (
            <p className="lc-quiz__feedback-text" data-tone={isCorrect ? 'correct' : 'incorrect'}>
              {isCorrect ? (
                <courseIcons.Check className="lc-icon" aria-hidden />
              ) : (
                <courseIcons.X className="lc-icon" aria-hidden />
              )}
              <span>
                <strong>{isCorrect ? 'נכון. ' : 'לא נכון. '}</strong>
                {isCorrect ? content.feedbackCorrect : content.feedbackIncorrect}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function optionState(option: QuizOption, submitted: boolean, solutionShown: boolean) {
  if (!submitted && !solutionShown) return undefined;
  return option.correct ? 'correct' : 'incorrect';
}

/** Fisher-Yates על עותק — התוכן המקורי לא משתנה */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
