import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import {
  FieldGroup,
  FieldNote,
  SegmentedField,
  SwitchField,
  TextField,
  type Option,
} from '@/editor/controls/Field';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createAccordionItem, type AccordionContent } from './content';

const modeOptions: Option<AccordionContent['mode']>[] = [
  { value: 'single', label: 'פריט אחד' },
  { value: 'multiple', label: 'כמה פריטים' },
];

export function AccordionSettings({
  block,
  onChange,
}: {
  block: BlockOf<AccordionContent>;
  onChange: (content: AccordionContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<AccordionContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <FieldGroup title="התנהגות">
        <SegmentedField
          label="פתיחה בו-זמנית"
          value={content.mode}
          options={modeOptions}
          onChange={(mode) => update({ mode })}
        />
        <SwitchField
          label="הפריט הראשון פתוח"
          hint="מראה ללומד מיד שיש כאן תוכן להרחיב"
          checked={content.openFirstByDefault}
          onChange={(openFirstByDefault) => update({ openFirstByDefault })}
        />
      </FieldGroup>

      <FieldGroup title="פריטים">
        <SubItemList
          label="פריטי האקורדיון"
          addLabel="הוספת פריט"
          items={content.items}
          onChange={(items) => update({ items })}
          createItem={() => createAccordionItem()}
          duplicateItem={(item) => ({ ...structuredClone(item), id: createId('item') })}
          minItems={1}
          maxItems={20}
          renderItem={(item) => (
            <TextField
              label="כותרת"
              value={item.title}
              onChange={(title) =>
                update({
                  items: content.items.map((current) =>
                    current.id === item.id ? { ...current, title } : current,
                  ),
                })
              }
            />
          )}
        />
        <FieldNote>את התוכן של כל פריט עורכים ישירות בקנבס.</FieldNote>
      </FieldGroup>
    </>
  );
}
