import { ArrowLeftRight } from 'lucide-react';
import type { BlockOf } from '@/model/types';
import {
  FieldGroup,
  FieldNote,
  SegmentedField,
  SelectField,
  SwitchField,
  TextField,
  type Option,
} from '@/editor/controls/Field';
import { Schematic, VariantField, type VariantOption } from '@/editor/controls/VariantField';
import { AssetField } from '@/editor/Assets/AssetField';
import type { TextImageContent } from './content';

const variantOptions: VariantOption<TextImageContent['variant']>[] = [
  {
    value: 'standard',
    label: 'רגיל',
    preview: (
      <Schematic>
        <rect x={4} y={8} width={18} height={12} rx={2} fill="currentColor" opacity={0.25} />
        <rect x={26} y={9} width={18} height={2.5} rx={1} fill="currentColor" opacity={0.35} />
        <rect x={26} y={14} width={14} height={2.5} rx={1} fill="currentColor" opacity={0.35} />
      </Schematic>
    ),
  },
  {
    value: 'feature',
    label: 'פיצ׳ר גדול',
    preview: (
      <Schematic>
        <rect x={4} y={5} width={24} height={18} rx={2} fill="currentColor" opacity={0.28} />
        <rect x={31} y={9} width={13} height={3} rx={1} fill="currentColor" opacity={0.4} />
        <rect x={31} y={15} width={10} height={2.5} rx={1} fill="currentColor" opacity={0.3} />
      </Schematic>
    ),
  },
];

const layoutOptions: Option<TextImageContent['layout']>[] = [
  { value: 'imageStart', label: 'תמונה בהתחלה' },
  { value: 'imageEnd', label: 'תמונה בסוף' },
  { value: 'imageTop', label: 'תמונה למעלה' },
];

const ratioOptions: Option<TextImageContent['ratio']>[] = [
  { value: '50-50', label: '50 / 50' },
  { value: '40-60', label: '40 / 60' },
  { value: '60-40', label: '60 / 40' },
];

export function TextImageSettings({
  block,
  onChange,
}: {
  block: BlockOf<TextImageContent>;
  onChange: (content: TextImageContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<TextImageContent>) => onChange({ ...content, ...patch });

  const swapSides = () =>
    update({ layout: content.layout === 'imageStart' ? 'imageEnd' : 'imageStart' });

  return (
    <>
      <FieldGroup title="פריסה">
        <VariantField
          label="וריאציה"
          value={content.variant}
          options={variantOptions}
          onChange={(variant) => update({ variant })}
        />
        <SelectField
          label="מיקום התמונה"
          value={content.layout}
          options={layoutOptions}
          onChange={(layout) => update({ layout })}
        />

        {content.layout !== 'imageTop' && (
          <>
            <button
              type="button"
              onClick={swapSides}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-fg-soft transition hover:bg-app"
            >
              <ArrowLeftRight className="size-3.5" aria-hidden />
              החלפת צדדים
            </button>
            <SegmentedField
              label="יחס העמודות"
              value={content.ratio}
              options={ratioOptions}
              onChange={(ratio) => update({ ratio })}
            />
            <SegmentedField
              label="יישור אנכי"
              value={content.verticalAlign}
              options={[
                { value: 'center', label: 'מרכז' },
                { value: 'start', label: 'למעלה' },
              ]}
              onChange={(verticalAlign) => update({ verticalAlign })}
            />
          </>
        )}

        <FieldNote>במסך צר הפריסה עוברת אוטומטית לאנכית, והתמונה עולה מעל הטקסט.</FieldNote>
      </FieldGroup>

      <FieldGroup title="תמונה">
        <AssetField
          label="קובץ התמונה"
          assetId={content.imageAssetId}
          onChange={(imageAssetId) => update({ imageAssetId })}
        />
        <TextField
          label="טקסט חלופי"
          placeholder="מה רואים בתמונה"
          value={content.alt}
          onChange={(alt) => update({ alt })}
        />
        {content.imageAssetId && !content.alt.trim() && (
          <FieldNote tone="warning">
            בלי טקסט חלופי, לומד שמשתמש בקורא מסך לא יקבל שום מידע מהתמונה. אם התמונה דקורטיבית
            בלבד — אפשר להשאיר ריק במכוון.
          </FieldNote>
        )}
        <TextField
          label="כיתוב"
          value={content.caption}
          onChange={(caption) => update({ caption })}
        />
        <SelectField
          label="יחס גובה-רוחב"
          value={content.aspectRatio}
          options={[
            { value: 'auto', label: 'לפי התמונה' },
            { value: '16:9', label: '16:9' },
            { value: '4:3', label: '4:3' },
            { value: '3:2', label: '3:2' },
            { value: '1:1', label: '1:1' },
          ]}
          onChange={(aspectRatio) => update({ aspectRatio })}
        />
        <SelectField
          label="פינות"
          value={content.roundness}
          options={[
            { value: 'none', label: 'חדות' },
            { value: 'small', label: 'קלות' },
            { value: 'medium', label: 'בינוניות' },
            { value: 'large', label: 'עגולות' },
          ]}
          onChange={(roundness) => update({ roundness })}
        />
      </FieldGroup>

      <FieldGroup title="כפתור">
        <SwitchField
          label="הצגת כפתור"
          checked={content.button.enabled}
          onChange={(enabled) => update({ button: { ...content.button, enabled } })}
        />
        {content.button.enabled && (
          <>
            <TextField
              label="טקסט"
              value={content.button.label}
              onChange={(label) => update({ button: { ...content.button, label } })}
            />
            <TextField
              label="קישור"
              placeholder="https://"
              value={content.button.href}
              onChange={(href) => update({ button: { ...content.button, href } })}
            />
          </>
        )}
      </FieldGroup>
    </>
  );
}
