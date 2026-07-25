import type { BlockOf } from '@/model/types';
import {
  ColorField,
  FieldGroup,
  FieldNote,
  SegmentedField,
  SelectField,
  SliderField,
  SwitchField,
  TextField,
  type Option,
} from '@/editor/controls/Field';
import { AssetField } from '@/editor/Assets/AssetField';
import { contrastRatio } from '@/renderer/theme/themeToCssVars';
import type { HeroContent } from './content';

interface SettingsProps {
  block: BlockOf<HeroContent>;
  onChange: (content: HeroContent) => void;
}

const heightOptions: Option<HeroContent['height']>[] = [
  { value: 'compact', label: 'נמוך' },
  { value: 'medium', label: 'בינוני' },
  { value: 'tall', label: 'גבוה' },
  { value: 'screen', label: 'מסך מלא' },
];

const alignOptions: Option<HeroContent['alignment']>[] = [
  { value: 'start', label: 'לימין' },
  { value: 'center', label: 'למרכז' },
  { value: 'end', label: 'לשמאל' },
];

const backgroundOptions: Option<HeroContent['backgroundType']>[] = [
  { value: 'color', label: 'צבע' },
  { value: 'gradient', label: 'גרדיאנט' },
  { value: 'image', label: 'תמונה' },
];

export function HeroSettings({ block, onChange }: SettingsProps) {
  const { content } = block;
  const update = (patch: Partial<HeroContent>) => onChange({ ...content, ...patch });

  // הטקסט בהירו תמיד לבן, ולכן רקע בהיר מדי הופך אותו לבלתי קריא
  const backgroundSample =
    content.backgroundType === 'gradient' ? content.gradientFrom : content.backgroundColor;
  const textContrast = contrastRatio('#ffffff', backgroundSample);
  const lowContrast = content.backgroundType !== 'image' && textContrast < 4.5;

  return (
    <>
      <FieldGroup title="רקע">
        <SegmentedField
          label="סוג רקע"
          value={content.backgroundType}
          options={backgroundOptions}
          onChange={(backgroundType) => update({ backgroundType })}
        />

        {content.backgroundType === 'color' && (
          <ColorField
            label="צבע הרקע"
            value={content.backgroundColor}
            onChange={(backgroundColor) => update({ backgroundColor })}
          />
        )}

        {content.backgroundType === 'gradient' && (
          <>
            <ColorField
              label="מצבע"
              value={content.gradientFrom}
              onChange={(gradientFrom) => update({ gradientFrom })}
            />
            <ColorField
              label="לצבע"
              value={content.gradientTo}
              onChange={(gradientTo) => update({ gradientTo })}
            />
          </>
        )}

        {content.backgroundType === 'image' && (
          <>
            <AssetField
              label="תמונת הרקע"
              assetId={content.imageAssetId}
              onChange={(imageAssetId) => update({ imageAssetId })}
            />
            <SliderField
              label="כהות שכבת הכיסוי"
              value={Math.round(content.overlayOpacity * 100)}
              min={0}
              max={90}
              step={5}
              unit="%"
              onChange={(value) => update({ overlayOpacity: value / 100 })}
            />
          </>
        )}

        {lowContrast && (
          <FieldNote tone="warning">
            הטקסט הלבן על רקע זה בניגודיות {textContrast.toFixed(1)}:1, מתחת לסף הקריאות של 4.5:1.
            כדאי לבחור צבע כהה יותר.
          </FieldNote>
        )}
      </FieldGroup>

      <FieldGroup title="תצוגה">
        <SelectField
          label="גובה"
          value={content.height}
          options={heightOptions}
          onChange={(height) => update({ height })}
        />
        <SegmentedField
          label="יישור"
          value={content.alignment}
          options={alignOptions}
          onChange={(alignment) => update({ alignment })}
        />
        <SwitchField
          label="רוחב מלא"
          hint="נצמד לקצוות המסך במקום להיכנס לתוך קונטיינר"
          checked={content.fullBleed}
          onChange={(fullBleed) => update({ fullBleed })}
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
            <SwitchField
              label="פתיחה בלשונית חדשה"
              checked={content.button.newTab}
              onChange={(newTab) => update({ button: { ...content.button, newTab } })}
            />
          </>
        )}
      </FieldGroup>
    </>
  );
}
