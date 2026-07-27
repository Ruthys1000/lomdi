import type { BlockOf } from '@/model/types';
import { FieldGroup, SelectField, TextField, type Option } from '@/editor/controls/Field';
import type { QuoteContent } from './content';

const variantOptions: Option<QuoteContent['variant']>[] = [
  { value: 'plain', label: 'פשוט' },
  { value: 'emphasis', label: 'מודגש' },
  { value: 'band', label: 'רצועה' },
];

export function QuoteSettings({
  block,
  onChange,
}: {
  block: BlockOf<QuoteContent>;
  onChange: (content: QuoteContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<QuoteContent>) => onChange({ ...content, ...patch });

  return (
    <FieldGroup title="ציטוט">
      <SelectField
        label="וריאציה"
        value={content.variant}
        options={variantOptions}
        onChange={(variant) => update({ variant })}
      />
      <TextField
        label="הציטוט"
        value={content.text}
        multiline
        onChange={(text) => update({ text })}
      />
      <TextField label="שם הדובר" value={content.author} onChange={(author) => update({ author })} />
      <TextField label="תפקיד / הקשר" value={content.role} onChange={(role) => update({ role })} />
    </FieldGroup>
  );
}
