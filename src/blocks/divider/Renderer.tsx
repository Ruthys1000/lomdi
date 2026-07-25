import type { BlockOf } from '@/model/types';
import { getCourseIcon } from '@/renderer/icons';
import type { DividerContent } from './content';

export function DividerRenderer({ block }: { block: BlockOf<DividerContent> }) {
  const { content } = block;
  const Icon = content.style === 'icon' ? getCourseIcon(content.icon) : undefined;

  // מפריד הוא קישוט: role="presentation" מונע מקורא מסך להכריז עליו
  const className = [
    'lc-divider',
    `lc-divider--${content.style}`,
    `lc-divider--h-${content.height}`,
    `lc-divider--w-${content.lineWidth}`,
  ].join(' ');

  if (content.style === 'space') {
    return <div className={className} role="presentation" />;
  }

  if (content.style === 'icon') {
    return (
      <div className={`lc-container ${className}`} role="presentation">
        <span className="lc-divider__rule" />
        {Icon && <Icon className="lc-divider__icon" aria-hidden />}
        <span className="lc-divider__rule" />
      </div>
    );
  }

  return (
    <div className={`lc-container ${className}`} role="presentation">
      <span className="lc-divider__rule" />
    </div>
  );
}
