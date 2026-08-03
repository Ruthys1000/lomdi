import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import { getCourseIcon } from '@/renderer/icons';
import type { CalloutContent } from './content';

interface CalloutEditorProps {
  block: BlockOf<CalloutContent>;
  onChange: (content: CalloutContent) => void;
}

/**
 * עריכת ה-callout על הקנבס. המבנה והקלאסים זהים ל-Renderer, ולכן המראה
 * אינו קופץ במעבר בין עריכה לתצוגה. הווריאציה והאייקון נבחרים בפאנל.
 */
export function CalloutEditor({ block, onChange }: CalloutEditorProps) {
  const { content } = block;
  const Icon = content.icon ? getCourseIcon(content.icon) : undefined;

  return (
    <div className="lc-container">
      <div className={`lc-callout lc-callout--${content.variant || 'takeaway'}`}>
        {Icon && (
          <span className="lc-callout__icon" aria-hidden>
            <Icon />
          </span>
        )}
        <div className="lc-callout__body">
          <InlineText
            as="p"
            className="lc-callout__title"
            ariaLabel="כותרת המסר"
            placeholder="כותרת"
            value={content.title}
            singleLine
            onChange={(title) => onChange({ ...content, title })}
          />
          <InlineText
            as="p"
            className="lc-callout__text"
            ariaLabel="טקסט המסר"
            placeholder="המסר המרכזי"
            value={content.text}
            onChange={(text) => onChange({ ...content, text })}
          />
        </div>
      </div>
    </div>
  );
}
