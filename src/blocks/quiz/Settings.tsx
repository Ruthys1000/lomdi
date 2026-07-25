import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import {
  FieldGroup,
  FieldNote,
  SwitchField,
  TextField,
} from '@/editor/controls/Field';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createQuizOption, quizIssues, type QuizContent } from './content';

export function QuizSettings({
  block,
  onChange,
}: {
  block: BlockOf<QuizContent>;
  onChange: (content: QuizContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<QuizContent>) => onChange({ ...content, ...patch });

  // בדיקה בזמן אמת — עדיף לתפוס שאלה שבורה כאן מאשר אצל הלומד
  const issues = quizIssues(content);

  return (
    <>
      {issues.length > 0 && (
        <FieldGroup title="דורש תשומת לב">
          <FieldNote tone="warning">
            {issues.map((issue) => (
              <span key={issue} className="block">
                {issue}
              </span>
            ))}
          </FieldNote>
        </FieldGroup>
      )}

      <FieldGroup title="שאלה">
        <TextField
          label="נוסח השאלה"
          value={content.question}
          onChange={(question) => update({ question })}
          multiline
        />
        <TextField
          label="רמז (אופציונלי)"
          value={content.hint}
          onChange={(hint) => update({ hint })}
        />
      </FieldGroup>

      <FieldGroup title="תשובות">
        <SubItemList
          label="אפשרויות התשובה"
          addLabel="הוספת תשובה"
          items={content.options}
          onChange={(options) => update({ options })}
          createItem={() => createQuizOption()}
          duplicateItem={(option) => ({
            ...structuredClone(option),
            id: createId('option'),
            correct: false,
          })}
          minItems={2}
          maxItems={6}
          renderItem={(option) => (
            <>
              <TextField
                label="נוסח"
                value={option.text}
                onChange={(text) =>
                  update({
                    options: content.options.map((current) =>
                      current.id === option.id ? { ...current, text } : current,
                    ),
                  })
                }
              />
              <SwitchField
                label="זו התשובה הנכונה"
                checked={option.correct}
                onChange={(correct) =>
                  update({
                    // תשובה נכונה אחת בלבד: סימון תשובה מבטל את האחרות,
                    // אבל ביטול סימון נוגע בתשובה הזו בלבד
                    options: content.options.map((current) =>
                      current.id === option.id
                        ? { ...current, correct }
                        : { ...current, correct: correct ? false : current.correct },
                    ),
                  })
                }
              />
            </>
          )}
        />
        <FieldNote>אפשר לסמן את התשובה הנכונה גם בלחיצה על הסימון שליד התשובה בקנבס.</FieldNote>
      </FieldGroup>

      <FieldGroup title="משוב">
        <TextField
          label="משוב לתשובה נכונה"
          value={content.feedbackCorrect}
          onChange={(feedbackCorrect) => update({ feedbackCorrect })}
          multiline
        />
        <TextField
          label="משוב לתשובה שגויה"
          value={content.feedbackIncorrect}
          onChange={(feedbackIncorrect) => update({ feedbackIncorrect })}
          multiline
        />
      </FieldGroup>

      <FieldGroup title="התנהגות">
        <SwitchField
          label="ערבוב התשובות"
          hint="סדר אקראי לכל לומד. בעריכה הסדר תמיד קבוע."
          checked={content.shuffle}
          onChange={(shuffle) => update({ shuffle })}
        />
        <SwitchField
          label="ניסיון נוסף"
          checked={content.allowRetry}
          onChange={(allowRetry) => update({ allowRetry })}
        />
        <SwitchField
          label="הצגת פתרון"
          checked={content.showSolution}
          onChange={(showSolution) => update({ showSolution })}
        />
      </FieldGroup>
    </>
  );
}
