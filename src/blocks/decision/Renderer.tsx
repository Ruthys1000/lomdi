import { useState } from 'react';
import type { BlockOf } from '@/model/types';
import { useRenderContext } from '@/renderer/RenderContext';
import type { DecisionContent } from './content';

/**
 * נקודת החלטה בתרחיש.
 *
 * אינטראקטיבי בתצוגה המקדימה ובתוצר (אותו רכיב). בבחירת אפשרות נחשף המשוב
 * שלה. `allowReselect` נותן ללומד לחקור השלכות של בחירות אחרות. בעורך
 * (`isEditing`) הבחירה מושבתת כדי לא להתנגש בעריכה — דפוס quiz.
 */
export function DecisionRenderer({ block }: { block: BlockOf<DecisionContent> }) {
  const { content } = block;
  const { isEditing } = useRenderContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = content.options.find((option) => option.id === selectedId);
  const locked = selectedId !== null && !content.allowReselect;

  return (
    <div className="lc-container">
      <div className="lc-decision">
        {content.prompt && <p className="lc-decision__prompt">{content.prompt}</p>}

        <div className="lc-decision__options">
          {content.options.map((option) => {
            const active = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                className="lc-decision__option"
                data-active={active || undefined}
                disabled={isEditing || (locked && !active)}
                aria-pressed={active}
                onClick={() => setSelectedId(option.id)}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {/* aria-live: הלומד שומע את ההשלכה מבלי לחפש אותה */}
        <div className="lc-decision__feedback" role="status" aria-live="polite">
          {selected && selected.feedback && (
            <p className="lc-decision__feedback-text">{selected.feedback}</p>
          )}
        </div>
      </div>
    </div>
  );
}
