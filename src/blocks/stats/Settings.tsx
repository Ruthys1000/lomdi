import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import {
  FieldGroup,
  FieldNote,
  SegmentedField,
  TextField,
  type Option,
} from '@/editor/controls/Field';
import { Schematic, VariantField, type VariantOption } from '@/editor/controls/VariantField';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createStat, type StatItem, type StatsContent } from './content';

const variantOptions: VariantOption<StatsContent['variant']>[] = [
  {
    value: 'plain',
    label: 'רגיל',
    preview: (
      <Schematic>
        {[4, 19, 34].map((x) => (
          <g key={x}>
            <rect x={x} y={9} width={10} height={5} rx={1} fill="currentColor" opacity={0.45} />
            <rect x={x + 2} y={16} width={6} height={2} rx={1} fill="currentColor" opacity={0.25} />
          </g>
        ))}
      </Schematic>
    ),
  },
  {
    value: 'gradient',
    label: 'רצועת גרדיאנט',
    preview: (
      <Schematic>
        <rect x={2} y={6} width={44} height={16} rx={3} fill="currentColor" opacity={0.15} />
        {[6, 21, 36].map((x) => (
          <rect key={x} x={x} y={11} width={6} height={5} rx={1} fill="currentColor" opacity={0.5} />
        ))}
      </Schematic>
    ),
  },
  {
    value: 'cards',
    label: 'כרטיסים',
    preview: (
      <Schematic>
        {[3, 18, 33].map((x) => (
          <rect key={x} x={x} y={7} width={12} height={14} rx={2} fill="currentColor" opacity={0.22} />
        ))}
      </Schematic>
    ),
  },
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
        <VariantField
          label="וריאציה"
          value={content.variant}
          options={variantOptions}
          columns={3}
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
