import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import {
  FieldGroup,
  FieldNote,
  SegmentedField,
  SelectField,
  TextField,
  type Option,
} from '@/editor/controls/Field';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createStat, type StatItem, type StatsContent } from './content';

const variantOptions: Option<StatsContent['variant']>[] = [
  { value: 'plain', label: 'רגיל' },
  { value: 'gradient', label: 'רצועת גרדיאנט' },
  { value: 'cards', label: 'כרטיסים' },
];

const columnOptions: Option<'2' | '3' | '4'>[] = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
];

export function StatsSettings({
  block,
  onChange,
}: {
  block: BlockOf<StatsContent>;
  onChange: (content: StatsContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<StatsContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <FieldGroup title="תצוגה">
        <SelectField
          label="וריאציה"
          value={content.variant}
          options={variantOptions}
          onChange={(variant) => update({ variant })}
        />
        <SegmentedField
          label="מספרים בשורה"
          value={String(content.columns) as '2' | '3' | '4'}
          options={columnOptions}
          onChange={(value) => update({ columns: Number(value) as 2 | 3 | 4 })}
        />
        <FieldNote>במסך צר המספרים עוברים אוטומטית לפריסה צרה יותר.</FieldNote>
      </FieldGroup>

      <FieldGroup title="מספרים">
        <SubItemList
          label="המספרים בבלוק"
          addLabel="הוספת מספר"
          items={content.items}
          onChange={(items) => update({ items })}
          createItem={() => createStat()}
          duplicateItem={(item) => ({ ...structuredClone(item), id: createId('stat') })}
          minItems={1}
          maxItems={4}
          renderItem={(item) => (
            <StatFields
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
      </FieldGroup>
    </>
  );
}

function StatFields({
  item,
  onPatch,
}: {
  item: StatItem;
  onPatch: (patch: Partial<StatItem>) => void;
}) {
  return (
    <>
      <TextField label="הערך" value={item.value} onChange={(value) => onPatch({ value })} />
      <TextField label="כותרת" value={item.label} onChange={(label) => onPatch({ label })} />
      <TextField label="תת-כותרת" value={item.sub} onChange={(sub) => onPatch({ sub })} />
    </>
  );
}
