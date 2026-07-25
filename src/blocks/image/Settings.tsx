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
import type { ImageContent } from './content';

const ratioOptions: Option<ImageContent['aspectRatio']>[] = [
  { value: 'auto', label: 'לפי התמונה' },
  { value: '16:9', label: '16:9 — רחב' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '1:1', label: '1:1 — ריבוע' },
  { value: '21:9', label: '21:9 — פנורמי' },
];

const roundnessOptions: Option<ImageContent['roundness']>[] = [
  { value: 'none', label: 'חדות' },
  { value: 'small', label: 'קלות' },
  { value: 'medium', label: 'בינוניות' },
  { value: 'large', label: 'עגולות' },
  { value: 'full', label: 'מעגל' },
];

export function ImageSettings({
  block,
  onChange,
}: {
  block: BlockOf<ImageContent>;
  onChange: (content: ImageContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<ImageContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <FieldGroup title="תמונה">
        <FieldNote>העלאת תמונות וספריית הנכסים מגיעות בשלב הבא.</FieldNote>
        <TextField
          label="טקסט חלופי"
          placeholder="מה רואים בתמונה"
          value={content.alt}
          onChange={(alt) => update({ alt })}
        />
        {!content.alt.trim() && (
          <FieldNote tone="warning">
            בלי טקסט חלופי, לומד שמשתמש בקורא מסך לא יקבל שום מידע מהתמונה. אם התמונה דקורטיבית
            בלבד — אפשר להשאיר ריק במכוון.
          </FieldNote>
        )}
        <TextField
          label="כיתוב"
          placeholder="כיתוב שיוצג מתחת לתמונה"
          value={content.caption}
          onChange={(caption) => update({ caption })}
        />
      </FieldGroup>

      <FieldGroup title="תצוגה">
        <SelectField
          label="יחס גובה-רוחב"
          value={content.aspectRatio}
          options={ratioOptions}
          onChange={(aspectRatio) => update({ aspectRatio })}
        />
        {content.aspectRatio !== 'auto' && (
          <SegmentedField
            label="התאמה"
            value={content.fit}
            options={[
              { value: 'cover', label: 'מילוי' },
              { value: 'contain', label: 'התאמה מלאה' },
            ]}
            onChange={(fit) => update({ fit })}
          />
        )}
        <SelectField
          label="פינות"
          value={content.roundness}
          options={roundnessOptions}
          onChange={(roundness) => update({ roundness })}
        />
        <SwitchField
          label="הגדלה בלחיצה"
          hint="פותח את התמונה בגודל מלא. פעיל בתצוגה מקדימה ובתוצר."
          checked={content.lightbox}
          onChange={(lightbox) => update({ lightbox })}
        />
      </FieldGroup>
    </>
  );
}
