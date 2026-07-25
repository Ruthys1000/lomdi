import type { BlockOf } from '@/model/types';
import { Figure, MediaPlaceholder } from '@/renderer/media';
import { useRenderContext } from '@/renderer/RenderContext';
import type { VideoContent } from './content';
import { videoEmbedUrl } from './embed';

/**
 * וידאו (סעיף 7.7).
 *
 * זה המקום היחיד שבו התוצר עשוי לפנות לאינטרנט, ורק אם המשתמש בחר בכך
 * במפורש. קובץ שהועלה מנוגן ישירות מתוך תיקיית הנכסים שב-ZIP, בנתיב יחסי.
 *
 * `loading="lazy"` על ה-iframe: הנגן מוצג גם בקנבס העריכה, ובלעדיו לומדה
 * עם כמה סרטונים הייתה פונה ליוטיוב בכל פתיחה של הפרק.
 */
export function VideoRenderer({ block }: { block: BlockOf<VideoContent> }) {
  const { content } = block;
  const { resolveAssetUrl, isEditing } = useRenderContext();

  const media =
    content.source === 'upload'
      ? renderUploadedVideo(content, resolveAssetUrl)
      : renderEmbed(content);

  return (
    <div className="lc-container">
      <Figure caption={content.caption}>
        <div
          className={`lc-video lc-round--${content.roundness}`}
          style={{ aspectRatio: aspectRatio(content.aspectRatio) }}
        >
          {media ?? (
            <MediaPlaceholder
              label={
                isEditing
                  ? 'הדביקו קישור לסרטון בפאנל ההגדרות'
                  : 'הסרטון אינו זמין'
              }
            />
          )}
        </div>
      </Figure>
    </div>
  );
}

const RATIOS: Record<string, string> = {
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '3:2': '3 / 2',
  '21:9': '21 / 9',
};

const aspectRatio = (value: string) => RATIOS[value] ?? '16 / 9';

function renderEmbed(content: VideoContent) {
  const url = videoEmbedUrl(content);
  if (!url) return null;

  return (
    <iframe
      src={url}
      title={content.caption || 'סרטון'}
      loading="lazy"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="lc-video__frame"
    />
  );
}

function renderUploadedVideo(
  content: VideoContent,
  resolveAssetUrl: (assetId: string) => string | undefined,
) {
  const src = content.assetId ? resolveAssetUrl(content.assetId) : undefined;
  if (!src) return null;

  const poster = content.posterAssetId ? resolveAssetUrl(content.posterAssetId) : undefined;

  return (
    <video
      src={src}
      poster={poster}
      controls={content.controls}
      autoPlay={content.autoplay}
      loop={content.loop}
      muted={content.muted || content.autoplay}
      playsInline
      preload="metadata"
      className="lc-video__frame"
    >
      הדפדפן שלך אינו תומך בהצגת וידאו.
    </video>
  );
}
