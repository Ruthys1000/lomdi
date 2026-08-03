import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import { FieldGroup, FieldNote, TextField } from '@/editor/controls/Field';
import { Schematic, VariantField, type VariantOption } from '@/editor/controls/VariantField';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createStep, type StepItem, type StepsContent } from './content';

const variantOptions: VariantOption<StepsContent['variant']>[] = [
  {
    value: 'numbered',
    label: 'ממוספר',
    preview: (
      <Schematic>
        <circle cx="9" cy="9" r="3.5" fill="currentColor" />
        <rect x="16" y="7" width="28" height="4" rx="2" fill="currentColor" opacity={0.4} />
        <circle cx="9" cy="19" r="3.5" fill="currentColor" />
        <rect x="16" y="17" width="28" height="4" rx="2" fill="currentColor" opacity={0.4} />
      </Schematic>
    ),
  },
  {
    value: 'arrow',
    label: 'זרימה',
    preview: (
      <Schematic>
        <rect x="4" y="7" width="16" height="14" rx="2" fill="currentColor" opacity={0.3} />
        <rect x="28" y="7" width="16" height="14" rx="2" fill="currentColor" opacity={0.3} />
        <path d="M22 14 l4 -3 v6 z" fill="currentColor" />
      </Schematic>
    ),
  },
];

export function StepsSettings({
  block,
  onChange,
}: {
  block: BlockOf<StepsContent>;
  onChange: (content: StepsContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<StepsContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <FieldGroup title="תצוגה">
        <VariantField
          label="סגנון"
          value={content.variant}
          options={variantOptions}
          onChange={(variant) => update({ variant })}
        />
      </FieldGroup>

      <FieldGroup title="שלבים">
        <SubItemList
          label="השלבים בבלוק"
          addLabel="הוספת שלב"
          items={content.items}
          onChange={(items) => update({ items })}
          createItem={() => createStep({ title: '' })}
          duplicateItem={(item) => ({ ...structuredClone(item), id: createId('step') })}
          minItems={1}
          maxItems={12}
          renderItem={(item) => (
            <StepFields
              item={item}
              onPatch={(patch) =>
                update({
                  items: content.items.map((current) =>
                    current.id === item.id ? { ...current, ...patch } : current,
                  ),
                })
              }
            />
          )}
        />
        <FieldNote>את הכותרת והטקסט אפשר לערוך גם ישירות על השלב בקנבס.</FieldNote>
      </FieldGroup>
    </>
  );
}

function StepFields({
  item,
  onPatch,
}: {
  item: StepItem;
  onPatch: (patch: Partial<StepItem>) => void;
}) {
  return (
    <TextField label="כותרת השלב" value={item.title} onChange={(title) => onPatch({ title })} />
  );
}
