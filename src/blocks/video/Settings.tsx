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
import { AssetField } from '@/editor/Assets/AssetField';
import { videoEmbedUrl, type VideoContent } from './content';

const sourceOptions: Option<VideoContent['source']>[] = [
  { value: 'youtube', label: 'יוטיוב' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'upload', label: 'קובץ' },
];

export function VideoSettings({
  block,
  onChange,
}: {
  block: BlockOf<VideoContent>;
  onChange: (content: VideoContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<VideoContent>) => onChange({ ...content, ...patch });

  const isLink = content.source !== 'upload';
  const linkRecognized = isLink && videoEmbedUrl(content) !== null;

  return (
    <>
      <FieldGroup title="מקור">
        <SegmentedField
          label="סוג המקור"
          value={content.source}
          options={sourceOptions}
          onChange={(source) => update({ source })}
        />

        {isLink && (
          <>
            <TextField
              label="קישור לסרטון"
              placeholder={content.source === 'youtube' ? 'https://youtu.be/…' : 'https://vimeo.com/…'}
              value={content.url}
              onChange={(url) => update({ url })}
            />
            {content.url.trim() !== '' && !linkRecognized && (
              <FieldNote tone="warning">
                הקישור אינו מזוהה. הדביקו את הכתובת המלאה של הסרטון משורת הכתובת.
              </FieldNote>
            )}
            {linkRecognized && (
              <FieldNote>
                הסרטון נטען מהשירות החיצוני, ולכן דורש אינטרנט גם בלומדה המיוצאת.
              </FieldNote>
            )}
          </>
        )}

        {content.source === 'upload' && (
          <>
            <AssetField
              label="קובץ הסרטון"
              kind="video"
              assetId={content.assetId}
              onChange={(assetId) => update({ assetId })}
            />
            <FieldNote>
              הקובץ נארז לתוך התוצר, ולכן הלומדה תרוץ גם בלי אינטרנט — אבל גם תשקול בהתאם.
            </FieldNote>
          </>
        )}

        <AssetField
          label="תמונת פתיחה"
          assetId={content.posterAssetId}
          onChange={(posterAssetId) => update({ posterAssetId })}
          hint="מוצגת לפני שהסרטון מתחיל. אופציונלית."
        />
      </FieldGroup>

      <FieldGroup title="תצוגה">
        <TextField
          label="כיתוב"
          value={content.caption}
          onChange={(caption) => update({ caption })}
        />
        <SelectField
          label="יחס גובה-רוחב"
          value={content.aspectRatio}
          options={[
            { value: '16:9', label: '16:9 — רגיל' },
            { value: '4:3', label: '4:3' },
            { value: '1:1', label: '1:1' },
            { value: '21:9', label: '21:9 — פנורמי' },
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

      <FieldGroup title="נגינה">
        <SwitchField
          label="הפעלה אוטומטית"
          hint="כבוי כברירת מחדל — הפעלה אוטומטית פוגעת בחוויית הלומד ובנגישות"
          checked={content.autoplay}
          onChange={(autoplay) => update({ autoplay })}
        />
        {content.source === 'upload' && (
          <>
            <SwitchField
              label="פקדי נגינה"
              checked={content.controls}
              onChange={(controls) => update({ controls })}
            />
            <SwitchField
              label="לולאה"
              checked={content.loop}
              onChange={(loop) => update({ loop })}
            />
            <SwitchField
              label="מושתק"
              checked={content.muted}
              onChange={(muted) => update({ muted })}
            />
          </>
        )}
        {content.autoplay && (
          <FieldNote tone="warning">
            דפדפנים חוסמים הפעלה אוטומטית עם קול. הסרטון יופעל מושתק.
          </FieldNote>
        )}
      </FieldGroup>
    </>
  );
}
