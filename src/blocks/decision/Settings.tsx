import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import { FieldGroup, FieldNote, SwitchField, TextField } from '@/editor/controls/Field';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createDecisionOption, type DecisionContent, type DecisionOption } from './content';

export function DecisionSettings({
  block,
  onChange,
}: {
  block: BlockOf<DecisionContent>;
  onChange: (content: DecisionContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<DecisionContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <FieldGroup title="ההחלטה">
        <TextField
          label="נוסח ההחלטה"
          value={content.prompt}
          onChange={(prompt) => update({ prompt })}
          multiline
        />
      </FieldGroup>

      <FieldGroup title="אפשרויות">
        <SubItemList
          label="אפשרויות הבחירה"
          addLabel="הוספת אפשרות"
          items={content.options}
          onChange={(options) => update({ options })}
          createItem={() => createDecisionOption()}
          duplicateItem={(option) => ({ ...structuredClone(option), id: createId('decisionOption') })}
          minItems={2}
          maxItems={5}
          renderItem={(option) => (
            <OptionFields
              option={option}
              onPatch={(patch) =>
                update({
                  options: content.options.map((current) =>
                    current.id === option.id ? { ...current, ...patch } : current,
                  ),
                })
              }
            />
          )}
        />
        <FieldNote>לכל אפשרות משוב משלה — אין תשובה "נכונה" אחת.</FieldNote>
      </FieldGroup>

      <FieldGroup title="התנהגות">
        <SwitchField
          label="אפשר בחירה חוזרת"
          hint="הלומד יכול לנסות אפשרות אחרת ולראות השלכה נוספת."
          checked={content.allowReselect}
          onChange={(allowReselect) => update({ allowReselect })}
        />
      </FieldGroup>
    </>
  );
}

function OptionFields({
  option,
  onPatch,
}: {
  option: DecisionOption;
  onPatch: (patch: Partial<DecisionOption>) => void;
}) {
  return (
    <>
      <TextField label="טקסט האפשרות" value={option.text} onChange={(text) => onPatch({ text })} />
      <TextField
        label="משוב / השלכה"
        value={option.feedback}
        onChange={(feedback) => onPatch({ feedback })}
        multiline
      />
    </>
  );
}
