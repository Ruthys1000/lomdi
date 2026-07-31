import type { BlockOf } from '@/model/types';
import { FieldGroup, TextField } from '@/editor/controls/Field';
import { Schematic, VariantField, type VariantOption } from '@/editor/controls/VariantField';
import type { QuoteContent } from './content';

const quoteLines = (
  <>
    <rect x={12} y={11} width={28} height={2.5} rx={1} fill="currentColor" opacity={0.35} />
    <rect x={12} y={16} width={20} height={2.5} rx={1} fill="currentColor" opacity={0.35} />
  </>
);

const variantOptions: VariantOption<QuoteContent['variant']>[] = [
  {
    value: 'plain',
    label: 'פשוט',
    preview: (
      <Schematic>
        <text x={5} y={16} fontSize={12} fill="currentColor" opacity={0.4}>
          &ldquo;
        </text>
        {quoteLines}
      </Schematic>
    ),
  },
  {
    value: 'emphasis',
    label: 'מודגש',
    preview: (
      <Schematic>
        <text x={3} y={18} fontSize={18} fontWeight="bold" fill="currentColor" opacity={0.55}>
          &ldquo;
        </text>
        {quoteLines}
      </Schematic>
    ),
  },
  {
    value: 'band',
    label: 'רצועה',
    preview: (
      <Schematic>
        <rect x={2} y={6} width={44} height={16} rx={3} fill="currentColor" opacity={0.14} />
        <rect x={42} y={6} width={2.5} height={16} fill="currentColor" opacity={0.5} />
        {quoteLines}
      </Schematic>
    ),
  },
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
      <VariantField
        label="וריאציה"
        value={content.variant}
        options={variantOptions}
        columns={3}
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
