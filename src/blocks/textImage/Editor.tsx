import type { BlockOf, RichTextDoc } from '@/model/types';
import { AssetImage, Figure, MediaPlaceholder } from '@/renderer/media';
import { useRenderContext } from '@/renderer/RenderContext';
import { RichTextEditor } from '@/editor/richText/RichTextEditor';
import type { TextImageContent } from './content';

interface TextImageEditorProps {
  block: BlockOf<TextImageContent>;
  onChange: (content: TextImageContent) => void;
}

export function TextImageEditor({ block, onChange }: TextImageEditorProps) {
  const { content } = block;
  const { resolveAssetUrl } = useRenderContext();
  const url = content.imageAssetId ? resolveAssetUrl(content.imageAssetId) : undefined;

  return (
    <div
      className={[
        'lc-container',
        'lc-text-image',
        // מחלקת הווריאציה הראשית חייבת להיות זהה ל-Renderer, אחרת בזמן עריכה
        // (כשהקנבס מציג את ה-Editor במקום ה-Renderer) הווריאציה לא מיושמת חי
        `lc-text-image--v-${content.variant || 'standard'}`,
        `lc-text-image--${content.layout}`,
        `lc-text-image--ratio-${content.ratio}`,
        `lc-text-image--v-${content.verticalAlign}`,
      ].join(' ')}
    >
      <div className="lc-text-image__media">
        {url ? (
          <Figure caption={content.caption}>
            <AssetImage
              url={url}
              alt={content.alt}
              ratio={content.aspectRatio}
              roundness={content.roundness}
            />
          </Figure>
        ) : (
          <MediaPlaceholder label="בחרו תמונה בפאנל ההגדרות" ratio={content.aspectRatio} />
        )}
      </div>

      <div className="lc-text-image__text">
        <RichTextEditor
          doc={content.doc}
          onChange={(doc: RichTextDoc) => onChange({ ...content, doc })}
          placeholder="כתבו כאן את הטקסט…"
        />
      </div>
    </div>
  );
}
