import type { BlockOf } from '@/model/types';
import { FieldGroup, FieldNote } from '@/editor/controls/Field';
import { IconPickerField } from '@/editor/controls/IconPickerField';
import { Schematic, VariantField, type VariantOption } from '@/editor/controls/VariantField';
import type { CalloutContent } from './content';

const variantOptions: VariantOption<CalloutContent['variant']>[] = [
  {
    value: 'takeaway',
    label: 'מסר',
    preview: (
      <Schematic>
        <rect x="4" y="8" width="40" height="12" rx="3" fill="currentColor" opacity={0.5} />
      </Schematic>
    ),
  },
  {
    value: 'info',
    label: 'מידע',
    preview: (
      <Schematic>
        <rect x="4" y="8" width="40" height="12" rx="3" fill="currentColor" opacity={0.28} />
        <rect x="4" y="8" width="3" height="12" rx="1.5" fill="currentColor" />
      </Schematic>
    ),
  },
  {
    value: 'success',
    label: 'הצלחה',
    preview: (
      <Schematic>
        <rect x="4" y="8" width="40" height="12" rx="3" fill="currentColor" opacity={0.28} />
        <circle cx="10" cy="14" r="3" fill="currentColor" />
      </Schematic>
    ),
  },
  {
    value: 'warning',
    label: 'אזהרה',
    preview: (
      <Schematic>
        <rect x="4" y="8" width="40" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.7} />
      </Schematic>
    ),
  },
];

export function CalloutSettings({
  block,
  onChange,
}: {
  block: BlockOf<CalloutContent>;
  onChange: (content: CalloutContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<CalloutContent>) => onChange({ ...content, ...patch });

  return (
    <FieldGroup title="מסר מרכזי">
      <VariantField
        label="סגנון"
        value={content.variant}
        options={variantOptions}
        onChange={(variant) => update({ variant })}
      />
      <IconPickerField label="אייקון" value={content.icon} onChange={(icon) => update({ icon })} />
      <FieldNote>את הכותרת והטקסט אפשר לערוך ישירות על הבלוק בקנבס.</FieldNote>
    </FieldGroup>
  );
}
