import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import type { ChallengeContent, ChallengeQuestion } from './content';
import type { QuizOption } from '../quiz/content';

interface ChallengeEditorProps {
  block: BlockOf<ChallengeContent>;
  onChange: (content: ChallengeContent) => void;
}

/**
 * עריכת המבחן על הקנבס. הטקסטים נערכים במקום; סימון התשובה הנכונה, ההסבר,
 * אחוז המעבר והוספת/מחיקת שאלות — בפאנל ההגדרות.
 */
export function ChallengeEditor({ block, onChange }: ChallengeEditorProps) {
  const { content } = block;

  const updateQuestion = (id: string, patch: Partial<ChallengeQuestion>) =>
    onChange({
      ...content,
      questions: content.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    });

  const updateOption = (questionId: string, optionId: string, patch: Partial<QuizOption>) => {
    const question = content.questions.find((q) => q.id === questionId);
    if (!question) return;
    updateQuestion(questionId, {
      options: question.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    });
  };

  return (
    <div className="lc-container">
      <div className="lc-challenge">
        <InlineText
          as="p"
          className="lc-challenge__intro"
          ariaLabel="פתיח המבחן"
          placeholder="הסבר קצר למבחן"
          value={content.intro}
          onChange={(intro) => onChange({ ...content, intro })}
        />

        <ol className="lc-challenge__questions">
          {content.questions.map((question, index) => (
            <li key={question.id} className="lc-challenge__question">
              <p className="lc-challenge__prompt">
                <span className="lc-challenge__num" aria-hidden>
                  {index + 1}
                </span>
                <InlineText
                  className="lc-challenge__prompt-text"
                  ariaLabel="נוסח השאלה"
                  placeholder="נוסח השאלה"
                  value={question.prompt}
                  singleLine
                  onChange={(prompt) => updateQuestion(question.id, { prompt })}
                />
              </p>

              <div className="lc-challenge__options">
                {question.options.map((option) => (
                  <label key={option.id} className="lc-challenge__option" data-correct={option.correct || undefined}>
                    <input type="radio" disabled checked={option.correct} readOnly className="lc-challenge__radio" />
                    <span className="lc-control lc-control--radio" aria-hidden />
                    <InlineText
                      className="lc-challenge__label"
                      ariaLabel="טקסט האפשרות"
                      placeholder="אפשרות"
                      value={option.text}
                      singleLine
                      onChange={(text) => updateOption(question.id, option.id, { text })}
                    />
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
