import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import type { DecisionContent, DecisionOption } from './content';

interface DecisionEditorProps {
  block: BlockOf<DecisionContent>;
  onChange: (content: DecisionContent) => void;
}

/**
 * עריכת נקודת ההחלטה על הקנבס. המבנה זהה ל-Renderer, ולכן המראה אינו קופץ.
 * את המשוב לכל אפשרות עורכים בפאנל ההגדרות; כאן עורכים את השאלה והאפשרויות.
 */
export function DecisionEditor({ block, onChange }: DecisionEditorProps) {
  const { content } = block;

  const updateOption = (id: string, patch: Partial<DecisionOption>) =>
    onChange({
      ...content,
      options: content.options.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    });

  return (
    <div className="lc-container">
      <div className="lc-decision">
        <InlineText
          as="p"
          className="lc-decision__prompt"
          ariaLabel="נוסח ההחלטה"
          placeholder="מה הייתם עושים?"
          value={content.prompt}
          onChange={(prompt) => onChange({ ...content, prompt })}
        />

        <div className="lc-decision__options">
          {content.options.map((option) => (
            <div key={option.id} className="lc-decision__option lc-decision__option--edit">
              <InlineText
                className="lc-decision__option-text"
                ariaLabel="טקסט האפשרות"
                placeholder="אפשרות בחירה"
                value={option.text}
                singleLine
                onChange={(text) => updateOption(option.id, { text })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
