import type { BlockOf } from '@/model/types';
import { getCourseIcon } from '@/renderer/icons';
import { AssetImage, MediaPlaceholder } from '@/renderer/media';
import { useRenderContext } from '@/renderer/RenderContext';
import type { CardItem, CardsContent } from './content';

export function CardsRenderer({ block }: { block: BlockOf<CardsContent> }) {
  const { content } = block;

  return (
    <div className="lc-container">
      <ul
        className={[
          'lc-cards',
          `lc-cards--cols-${content.columns}`,
          `lc-cards--align-${content.textAlign}`,
        ].join(' ')}
      >
        {content.items.map((item) => (
          <Card key={item.id} item={item} content={content} />
        ))}
      </ul>
    </div>
  );
}

function Card({ item, content }: { item: CardItem; content: CardsContent }) {
  const { resolveAssetUrl } = useRenderContext();
  const Icon = content.media === 'icon' ? getCourseIcon(item.icon) : undefined;
  const imageUrl = content.media === 'image' && item.imageAssetId
    ? resolveAssetUrl(item.imageAssetId)
    : undefined;

  return (
    <li className={`lc-card lc-round--${content.roundness}`}>
      {content.media === 'icon' && Icon && (
        <span className="lc-card__icon" aria-hidden>
          <Icon />
        </span>
      )}

      {content.media === 'image' &&
        (imageUrl ? (
          <AssetImage
            url={imageUrl}
            alt=""
            ratio="16:9"
            roundness="small"
            className="lc-card__image"
          />
        ) : (
          <MediaPlaceholder label="בחרו תמונה" ratio="16:9" />
        ))}

      {item.title && <h3 className="lc-card__title">{item.title}</h3>}
      {item.text && <p className="lc-card__text">{item.text}</p>}

      {item.button.enabled && item.button.label && (
        <p className="lc-card__actions">
          <a
            className="lc-card__link"
            href={item.button.href || '#'}
            {...(item.button.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {item.button.label}
          </a>
        </p>
      )}
    </li>
  );
}
