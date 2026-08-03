import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import { FieldGroup, FieldNote, SliderField, SwitchField, TextField } from '@/editor/controls/Field';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createQuizOption, type QuizOption } from '../quiz/content';
import {
  challengeIssues,
  createChallengeQuestion,
  type ChallengeContent,
  type ChallengeQuestion,
} from './content';

export function ChallengeSettings({
  block,
  onChange,
}: {
  block: BlockOf<ChallengeContent>;
  onChange: (content: ChallengeContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<ChallengeContent>) => onChange({ ...content, ...patch });
  const issues = challengeIssues(content);

  const setQuestion = (id: string, patch: Partial<ChallengeQuestion>) =>
    update({
      questions: content.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    });

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

      <FieldGroup title="המבחן">
        <TextField
          label="פתיח"
          value={content.intro}
          onChange={(intro) => update({ intro })}
          multiline
        />
        <SliderField
          label="אחוז מעבר"
          value={content.passScore}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(passScore) => update({ passScore })}
        />
        <TextField
          label="משוב במעבר"
          value={content.resultPass}
          onChange={(resultPass) => update({ resultPass })}
          multiline
        />
        <TextField
          label="משוב בכישלון"
          value={content.resultFail}
          onChange={(resultFail) => update({ resultFail })}
          multiline
        />
      </FieldGroup>

      <FieldGroup title="שאלות">
        <SubItemList
          label="שאלות המבחן"
          addLabel="הוספת שאלה"
          items={content.questions}
          onChange={(questions) => update({ questions })}
          createItem={() => createChallengeQuestion()}
          duplicateItem={(q) => ({
            ...structuredClone(q),
            id: createId('challengeQuestion'),
            options: q.options.map((o) => ({ ...o, id: createId('option') })),
          })}
          minItems={1}
          maxItems={12}
          renderItem={(question) => (
            <QuestionFields
              question={question}
              onPatch={(patch) => setQuestion(question.id, patch)}
            />
          )}
        />
      </FieldGroup>
    </>
  );
}

function QuestionFields({
  question,
  onPatch,
}: {
  question: ChallengeQuestion;
  onPatch: (patch: Partial<ChallengeQuestion>) => void;
}) {
  const setOptions = (options: QuizOption[]) => onPatch({ options });

  return (
    <>
      <TextField
        label="נוסח השאלה"
        value={question.prompt}
        onChange={(prompt) => onPatch({ prompt })}
        multiline
      />

      <SubItemList
        label="אפשרויות"
        addLabel="הוספת אפשרות"
        items={question.options}
        onChange={setOptions}
        createItem={() => createQuizOption()}
        duplicateItem={(option) => ({ ...structuredClone(option), id: createId('option'), correct: false })}
        minItems={2}
        maxItems={6}
        renderItem={(option) => (
          <>
            <TextField
              label="נוסח"
              value={option.text}
              onChange={(text) =>
                setOptions(question.options.map((o) => (o.id === option.id ? { ...o, text } : o)))
              }
            />
            <SwitchField
              label="זו התשובה הנכונה"
              checked={option.correct}
              onChange={(correct) =>
                // תשובה נכונה אחת בלבד: סימון מבטל את האחרות
                setOptions(
                  question.options.map((o) =>
                    o.id === option.id
                      ? { ...o, correct }
                      : { ...o, correct: correct ? false : o.correct },
                  ),
                )
              }
            />
          </>
        )}
      />

      <TextField
        label="הסבר (נחשף אחרי הבדיקה)"
        value={question.explanation}
        onChange={(explanation) => onPatch({ explanation })}
        multiline
      />
    </>
  );
}
