import type { BlockOf } from '@/model/types';
import { FieldGroup, SegmentedField, SelectField, type Option } from '@/editor/controls/Field';
import { courseIconNames } from '@/renderer/icons';
import type { DividerContent } from './content';

const styleOptions: Option<DividerContent['style']>[] = [
  { value: 'space', label: 'רווח' },
  { value: 'line', label: 'קו' },
  { value: 'icon', label: 'אייקון' },
  { value: 'gradient', label: 'מעבר צבע' },
];

const heightOptions: Option<DividerContent['height']>[] = [
  { value: 'small', label: 'נמוך' },
  { value: 'medium', label: 'בינוני' },
  { value: 'large', label: 'גבוה' },
];

const widthOptions: Option<DividerContent['lineWidth']>[] = [
  { value: 'short', label: 'קצר' },
  { value: 'half', label: 'חצי' },
  { value: 'full', label: 'מלא' },
];

export function DividerSettings({
  block,
  onChange,
}: {
  block: BlockOf<DividerContent>;
  onChange: (content: DividerContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<DividerContent>) => onChange({ ...content, ...patch });

  return (
    <FieldGroup title="מפריד">
      <SelectField
        label="סגנון"
        value={content.style}
        options={styleOptions}
        onChange={(style) => update({ style })}
      />
      <SegmentedField
        label="גובה"
        value={content.height}
        options={heightOptions}
        onChange={(height) => update({ height })}
      />

      {content.style !== 'space' && (
        <SegmentedField
          label="אורך הקו"
          value={content.lineWidth}
          options={widthOptions}
          onChange={(lineWidth) => update({ lineWidth })}
        />
      )}

      {content.style === 'icon' && (
        <SelectField
          label="אייקון"
          value={content.icon}
          options={courseIconNames.map((name) => ({ value: name, label: name }))}
          onChange={(icon) => update({ icon })}
        />
      )}
    </FieldGroup>
  );
}
