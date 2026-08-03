import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import type { StepItem, StepsContent } from './content';

interface StepsEditorProps {
  block: BlockOf<StepsContent>;
  onChange: (content: StepsContent) => void;
}

/**
 * עריכת השלבים על הקנבס. המבנה זהה ל-Renderer, ולכן המראה אינו קופץ.
 * הוספה, מחיקה וסידור נעשים בפאנל ההגדרות — כאן עורכים תוכן.
 */
export function StepsEditor({ block, onChange }: StepsEditorProps) {
  const { content } = block;

  const updateStep = (id: string, patch: Partial<StepItem>) =>
    onChange({
      ...content,
      items: content.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="lc-container">
      <ol className={`lc-steps lc-steps--${content.variant || 'numbered'}`}>
        {content.items.map((item, index) => (
          <li key={item.id} className="lc-step">
            <span className="lc-step__marker" aria-hidden>
              {index + 1}
            </span>
            <div className="lc-step__body">
              <InlineText
                as="h3"
                className="lc-step__title"
                ariaLabel="כותרת השלב"
                placeholder="כותרת השלב"
                value={item.title}
                singleLine
                onChange={(title) => updateStep(item.id, { title })}
              />
              <InlineText
                as="p"
                className="lc-step__text"
                ariaLabel="טקסט השלב"
                placeholder="מה עושים בשלב"
                value={item.text}
                onChange={(text) => updateStep(item.id, { text })}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
