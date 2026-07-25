import { useEffect, useRef, useState } from 'react';
import type { BlockOf } from '@/model/types';
import { AssetImage, Figure, MediaPlaceholder } from '@/renderer/media';
import { useRenderContext } from '@/renderer/RenderContext';
import type { ImageContent } from './content';

export function ImageRenderer({ block }: { block: BlockOf<ImageContent> }) {
  const { content } = block;
  const { resolveAssetUrl, isEditing } = useRenderContext();
  const url = content.assetId ? resolveAssetUrl(content.assetId) : undefined;

  const [isOpen, setOpen] = useState(false);

  if (!url) {
    return (
      <div className="lc-container">
        <MediaPlaceholder label="בחרו תמונה בפאנל ההגדרות" ratio={content.aspectRatio} />
      </div>
    );
  }

  const image = (
    <AssetImage
      url={url}
      alt={content.alt}
      ratio={content.aspectRatio}
      fit={content.fit}
      roundness={content.roundness}
    />
  );

  return (
    <div className="lc-container">
      <Figure caption={content.caption}>
        {/* בעורך הלחיצה משמשת לבחירת הבלוק, ולכן ההגדלה מושבתת שם */}
        {content.lightbox && !isEditing ? (
          <button type="button" className="lc-image-button" onClick={() => setOpen(true)}>
            {image}
            <span className="lc-sr-only">הגדלת התמונה{content.alt ? `: ${content.alt}` : ''}</span>
          </button>
        ) : (
          image
        )}
      </Figure>

      {isOpen && (
        <Lightbox alt={content.alt} url={url} caption={content.caption} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/**
 * הגדלת תמונה.
 *
 * בנוי על <dialog> המובנה, כדי לקבל מהדפדפן focus trap, סגירה ב-Escape
 * והחזרת הפוקוס לכפתור שפתח — במקום לממש את כל אלה ביד ולשכוח חלק.
 */
function Lightbox({
  url,
  alt,
  caption,
  onClose,
}: {
  url: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="lc-lightbox" onClose={onClose} aria-label={alt || 'תצוגת תמונה'}>
      <button type="button" className="lc-lightbox__close" onClick={onClose} aria-label="סגירה">
        ✕
      </button>
      <img src={url} alt={alt} className="lc-lightbox__image" />
      {caption && <p className="lc-lightbox__caption">{caption}</p>}
    </dialog>
  );
}
