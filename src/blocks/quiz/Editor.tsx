import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import { courseIcons } from '@/renderer/icons';
import type { QuizContent, QuizOption } from './content';

interface QuizEditorProps {
  block: BlockOf<QuizContent>;
  onChange: (content: QuizContent) => void;
}

/**
 * עריכת השאלה על הקנבס.
 *
 * אין כאן ערבוב ואין מצב "נענה" — בעריכה מוצגות כל התשובות בסדר הקבוע,
 * עם סימון ברור של הנכונה. עורך שרואה את התשובות קופצות בכל הקלדה, או
 * שצריך לענות על השאלה כדי לערוך אותה, לא יכול לעבוד.
 */
export function QuizEditor({ block, onChange }: QuizEditorProps) {
  const { content } = block;

  const updateOption = (id: string, patch: Partial<QuizOption>) =>
    onChange({
      ...content,
      options: content.options.map((option) =>
        option.id === id ? { ...option, ...patch } : option,
      ),
    });

  // תשובה נכונה אחת בלבד: סימון תשובה מבטל את הקודמת
  const markCorrect = (id: string) =>
    onChange({
      ...content,
      options: content.options.map((option) => ({ ...option, correct: option.id === id })),
    });

  return (
    <div className="lc-container">
      <div className="lc-quiz">
        <InlineText
          as="p"
          className="lc-quiz__question"
          ariaLabel="נוסח השאלה"
          placeholder="נוסח השאלה"
          value={content.question}
          onChange={(question) => onChange({ ...content, question })}
        />

        <div className="lc-quiz__options">
          {content.options.map((option) => (
            <div
              key={option.id}
              className="lc-quiz__option"
              data-state={option.correct ? 'correct' : undefined}
            >
              <button
                type="button"
                onClick={() => markCorrect(option.id)}
                aria-pressed={option.correct}
                aria-label={option.correct ? 'התשובה הנכונה' : 'סימון כתשובה הנכונה'}
                title={option.correct ? 'התשובה הנכונה' : 'סימון כתשובה הנכונה'}
                className="lc-quiz__correct-toggle"
              >
                <courseIcons.Check aria-hidden />
              </button>

              <InlineText
                className="lc-quiz__label"
                ariaLabel="נוסח התשובה"
                placeholder="נוסח התשובה"
                value={option.text}
                singleLine
                onChange={(text) => updateOption(option.id, { text })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
