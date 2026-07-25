import type { BlockOf } from '@/model/types';
import { AssetImage, Figure, MediaPlaceholder } from '@/renderer/media';
import { useRenderContext } from '@/renderer/RenderContext';
import { RichTextView } from '@/renderer/RichTextView';
import type { TextImageContent } from './content';

/**
 * טקסט לצד תמונה.
 *
 * הפריסה מבוססת grid עם יחסי עמודות, ומתקפלת לאנכית מתחת ל-720px
 * (ראה course.css). imageStart/imageEnd הם ערכים לוגיים: בעברית
 * imageStart הוא ימין, ובאנגלית שמאל — אותו תוכן, בלי שכפול הגדרות.
 */
export function TextImageRenderer({ block }: { block: BlockOf<TextImageContent> }) {
  const { content } = block;
  const { resolveAssetUrl } = useRenderContext();
  const url = content.imageAssetId ? resolveAssetUrl(content.imageAssetId) : undefined;

  const media = url ? (
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
  );

  return (
    <div
      className={[
        'lc-container',
        'lc-text-image',
        `lc-text-image--${content.layout}`,
        `lc-text-image--ratio-${content.ratio}`,
        `lc-text-image--v-${content.verticalAlign}`,
      ].join(' ')}
    >
      <div className="lc-text-image__media">{media}</div>

      <div className="lc-text-image__text">
        <RichTextView doc={content.doc} />

        {content.button.enabled && content.button.label && (
          <p className="lc-text-image__actions">
            <a
              className="lc-button lc-button--primary"
              href={content.button.href || '#'}
              {...(content.button.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {content.button.label}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
