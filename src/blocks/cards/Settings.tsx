import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import { courseIconNames } from '@/renderer/icons';
import {
  FieldGroup,
  FieldNote,
  SegmentedField,
  SelectField,
  SwitchField,
  TextField,
  type Option,
} from '@/editor/controls/Field';
import { AssetField } from '@/editor/Assets/AssetField';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createCard, type CardItem, type CardsContent } from './content';

const columnOptions: Option<'2' | '3' | '4'>[] = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
];

const mediaOptions: Option<CardsContent['media']>[] = [
  { value: 'icon', label: 'אייקון' },
  { value: 'image', label: 'תמונה' },
  { value: 'none', label: 'ללא' },
];

const variantOptions: Option<CardsContent['variant']>[] = [
  { value: 'plain', label: 'רגיל' },
  { value: 'numbered', label: 'ממוספר' },
  { value: 'gradient', label: 'גרדיאנט' },
  { value: 'outline', label: 'מסגרת' },
];

export function CardsSettings({
  block,
  onChange,
}: {
  block: BlockOf<CardsContent>;
  onChange: (content: CardsContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<CardsContent>) => onChange({ ...content, ...patch });

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
          label="כרטיסים בשורה"
          value={String(content.columns) as '2' | '3' | '4'}
          options={columnOptions}
          onChange={(value) => update({ columns: Number(value) as 2 | 3 | 4 })}
        />
        <SegmentedField
          label="מדיה"
          value={content.media}
          options={mediaOptions}
          onChange={(media) => update({ media })}
        />
        <SegmentedField
          label="יישור טקסט"
          value={content.textAlign}
          options={[
            { value: 'start', label: 'לימין' },
            { value: 'center', label: 'למרכז' },
          ]}
          onChange={(textAlign) => update({ textAlign })}
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
        <FieldNote>במסך צר הכרטיסים עוברים אוטומטית לעמודה אחת.</FieldNote>
      </FieldGroup>

      <FieldGroup title="כרטיסים">
        <SubItemList
          label="הכרטיסים בבלוק"
          addLabel="הוספת כרטיס"
          items={content.items}
          onChange={(items) => update({ items })}
          createItem={() => createCard()}
          duplicateItem={(item) => ({ ...structuredClone(item), id: createId('card') })}
          minItems={1}
          maxItems={8}
          renderItem={(item) => (
            <CardFields
              item={item}
              media={content.media}
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
        <FieldNote>את הכותרת והטקסט אפשר לערוך גם ישירות על הכרטיס בקנבס.</FieldNote>
      </FieldGroup>
    </>
  );
}

function CardFields({
  item,
  media,
  onPatch,
}: {
  item: CardItem;
  media: CardsContent['media'];
  onPatch: (patch: Partial<CardItem>) => void;
}) {
  return (
    <>
      <TextField
        label="כותרת"
        value={item.title}
        onChange={(title) => onPatch({ title })}
      />

      {media === 'icon' && (
        <SelectField
          label="אייקון"
          value={item.icon}
          options={courseIconNames.map((name) => ({ value: name, label: name }))}
          onChange={(icon) => onPatch({ icon })}
        />
      )}

      {media === 'image' && (
        <AssetField
          label="תמונת הכרטיס"
          assetId={item.imageAssetId}
          onChange={(imageAssetId) => onPatch({ imageAssetId })}
        />
      )}

      <SwitchField
        label="כפתור"
        checked={item.button.enabled}
        onChange={(enabled) => onPatch({ button: { ...item.button, enabled } })}
      />

      {item.button.enabled && (
        <TextField
          label="קישור"
          placeholder="https://"
          value={item.button.href}
          onChange={(href) => onPatch({ button: { ...item.button, href } })}
        />
      )}
    </>
  );
}
