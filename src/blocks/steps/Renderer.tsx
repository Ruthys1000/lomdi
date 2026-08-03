import type { BlockOf } from '@/model/types';
import type { StepItem, StepsContent } from './content';

export function StepsRenderer({ block }: { block: BlockOf<StepsContent> }) {
  const { content } = block;

  return (
    <div className="lc-container">
      <ol className={`lc-steps lc-steps--${content.variant || 'numbered'}`}>
        {content.items.map((item, index) => (
          <Step key={item.id} item={item} index={index} />
        ))}
      </ol>
    </div>
  );
}

function Step({ item, index }: { item: StepItem; index: number }) {
  return (
    <li className="lc-step">
      <span className="lc-step__marker" aria-hidden>
        {index + 1}
      </span>
      <div className="lc-step__body">
        {item.title && <h3 className="lc-step__title">{item.title}</h3>}
        {item.text && <p className="lc-step__text">{item.text}</p>}
      </div>
    </li>
  );
}
