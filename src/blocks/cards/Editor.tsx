import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import { getCourseIcon } from '@/renderer/icons';
import { AssetImage, MediaPlaceholder } from '@/renderer/media';
import { useRenderContext } from '@/renderer/RenderContext';
import type { CardItem, CardsContent } from './content';

interface CardsEditorProps {
  block: BlockOf<CardsContent>;
  onChange: (content: CardsContent) => void;
}

/**
 * עריכת הכרטיסים על הקנבס.
 *
 * המבנה והקלאסים זהים ל-Renderer, ולכן המראה אינו קופץ במעבר בין עריכה
 * לתצוגה. הוספה, מחיקה וסידור נעשים בפאנל ההגדרות — כאן עורכים תוכן.
 */
export function CardsEditor({ block, onChange }: CardsEditorProps) {
  const { content } = block;

  const updateCard = (id: string, patch: Partial<CardItem>) =>
    onChange({
      ...content,
      items: content.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="lc-container">
      <ul
        className={[
          'lc-cards',
          // מחלקת הווריאציה חייבת להיות זהה ל-Renderer, אחרת בזמן עריכה
          // (כשהקנבס מציג את ה-Editor במקום ה-Renderer) הווריאציה לא מיושמת חי
          `lc-cards--v-${content.variant || 'plain'}`,
          `lc-cards--cols-${content.columns}`,
          `lc-cards--align-${content.textAlign}`,
        ].join(' ')}
      >
        {content.items.map((item) => (
          <EditableCard
            key={item.id}
            item={item}
            content={content}
            onPatch={(patch) => updateCard(item.id, patch)}
          />
        ))}
      </ul>
    </div>
  );
}

function EditableCard({
  item,
  content,
  onPatch,
}: {
  item: CardItem;
  content: CardsContent;
  onPatch: (patch: Partial<CardItem>) => void;
}) {
  const { resolveAssetUrl } = useRenderContext();
  const Icon = content.media === 'icon' ? getCourseIcon(item.icon) : undefined;
  const imageUrl =
    content.media === 'image' && item.imageAssetId ? resolveAssetUrl(item.imageAssetId) : undefined;

  return (
    <li className={`lc-card lc-round--${content.roundness}`}>
      {content.media === 'icon' && Icon && (
        <span className="lc-card__icon" aria-hidden>
          <Icon />
        </span>
      )}

      {content.media === 'image' &&
        (imageUrl ? (
          <AssetImage url={imageUrl} alt="" ratio="16:9" roundness="small" className="lc-card__image" />
        ) : (
          <MediaPlaceholder label="בחרו תמונה" ratio="16:9" />
        ))}

      <InlineText
        as="h3"
        className="lc-card__title"
        ariaLabel="כותרת הכרטיס"
        placeholder="כותרת"
        value={item.title}
        singleLine
        onChange={(title) => onPatch({ title })}
      />

      <InlineText
        as="p"
        className="lc-card__text"
        ariaLabel="טקסט הכרטיס"
        placeholder="טקסט קצר"
        value={item.text}
        onChange={(text) => onPatch({ text })}
      />

      {item.button.enabled && (
        <p className="lc-card__actions">
          <InlineText
            className="lc-card__link"
            ariaLabel="טקסט הקישור"
            placeholder="טקסט הקישור"
            value={item.button.label}
            singleLine
            onChange={(label) => onPatch({ button: { ...item.button, label } })}
          />
        </p>
      )}
    </li>
  );
}
