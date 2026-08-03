import type { BlockOf } from '@/model/types';
import { getCourseIcon } from '@/renderer/icons';
import type { CalloutContent } from './content';

export function CalloutRenderer({ block }: { block: BlockOf<CalloutContent> }) {
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
          {content.title && <p className="lc-callout__title">{content.title}</p>}
          {content.text && <p className="lc-callout__text">{content.text}</p>}
        </div>
      </div>
    </div>
  );
}
