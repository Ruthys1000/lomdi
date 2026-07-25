import type { BlockOf } from '@/model/types';
import { FieldGroup, FieldNote, SegmentedField, type Option } from '@/editor/controls/Field';
import type { RichTextContent } from './content';

const widthOptions: Option<RichTextContent['maxWidth']>[] = [
  { value: 'narrow', label: 'צר' },
  { value: 'normal', label: 'רגיל' },
  { value: 'wide', label: 'רחב' },
];

export function RichTextSettings({
  block,
  onChange,
}: {
  block: BlockOf<RichTextContent>;
  onChange: (content: RichTextContent) => void;
}) {
  return (
    <FieldGroup title="טקסט">
      <SegmentedField
        label="רוחב שורת הטקסט"
        value={block.content.maxWidth}
        options={widthOptions}
        onChange={(maxWidth) => onChange({ ...block.content, maxWidth })}
      />
      <FieldNote>
        שורה של כ-65 תווים היא הקריאה ביותר. &quot;רחב&quot; מתאים לטבלאות ולרשימות קצרות.
      </FieldNote>
    </FieldGroup>
  );
}
