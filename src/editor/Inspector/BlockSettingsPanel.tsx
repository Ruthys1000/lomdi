import { getEditorBlockDefinition } from '@/blocks/registry.editor';
import type {
  Block,
  BlockAlignment,
  BlockBackground,
  BlockContent,
  BlockWidth,
  Spacing,
} from '@/model/types';
import { useCourseStore } from '@/state/courseStore';
import { FieldGroup, SegmentedField, SelectField, type Option } from '../controls/Field';

const widthOptions: Option<BlockWidth>[] = [
  { value: 'narrow', label: 'צר' },
  { value: 'normal', label: 'רגיל' },
  { value: 'wide', label: 'רחב' },
  { value: 'full', label: 'מלא' },
];

// start/end ולא ימין/שמאל — הערך נשמר לוגית ומתהפך לבד בלומדה באנגלית
const alignmentOptions: Option<BlockAlignment>[] = [
  { value: 'start', label: 'לימין' },
  { value: 'center', label: 'למרכז' },
  { value: 'end', label: 'לשמאל' },
];

const backgroundOptions: Option<BlockBackground>[] = [
  { value: 'transparent', label: 'ללא רקע' },
  { value: 'surface', label: 'משטח בהיר' },
  { value: 'muted', label: 'עמום' },
  { value: 'primary', label: 'צבע ראשי' },
  { value: 'accent', label: 'צבע הדגשה' },
];

const spacingOptions: Option<Spacing>[] = [
  { value: 'none', label: 'ללא' },
  { value: 'small', label: 'קטן' },
  { value: 'medium', label: 'בינוני' },
  { value: 'large', label: 'גדול' },
];

/**
 * הגדרות הבלוק: קודם ההגדרות הייחודיות לסוג שלו, ואז הפריסה המשותפת.
 * הסדר מכוון — מה שמייחד את הבלוק נמצא למעלה, שם מסתכלים קודם.
 */
export function BlockSettingsPanel({ block }: { block: Block }) {
  const updateBlockSettings = useCourseStore((state) => state.updateBlockSettings);
  const updateBlockContent = useCourseStore((state) => state.updateBlockContent);

  const definition = getEditorBlockDefinition(block.type);
  const SettingsComponent = definition?.SettingsComponent;

  const update = (patch: Parameters<typeof updateBlockSettings>[1]) =>
    updateBlockSettings(block.id, patch);

  return (
    <>
      {SettingsComponent && (
        <SettingsComponent
          block={block as never}
          onChange={((content: BlockContent) => updateBlockContent(block.id, content)) as never}
        />
      )}

      <FieldGroup title="פריסה">
        <SegmentedField
          label="רוחב"
          value={block.settings.width}
          options={widthOptions}
          onChange={(width) => update({ width })}
        />
        <SegmentedField
          label="יישור"
          value={block.settings.alignment}
          options={alignmentOptions}
          onChange={(alignment) => update({ alignment })}
        />
      </FieldGroup>

      <FieldGroup title="רקע ומרווחים">
        <SelectField
          label="רקע"
          value={block.settings.background}
          options={backgroundOptions}
          onChange={(background) => update({ background })}
        />
        <SelectField
          label="מרווח עליון"
          value={block.settings.spacingTop}
          options={spacingOptions}
          onChange={(spacingTop) => update({ spacingTop })}
        />
        <SelectField
          label="מרווח תחתון"
          value={block.settings.spacingBottom}
          options={spacingOptions}
          onChange={(spacingBottom) => update({ spacingBottom })}
        />
      </FieldGroup>
    </>
  );
}
