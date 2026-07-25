import { useId, useState } from 'react';
import { InlineText } from '@/editor/inline/InlineText';
import { RichTextEditor } from '@/editor/richText/RichTextEditor';
import type { BlockOf, RichTextDoc } from '@/model/types';
import { navIcons } from '@/renderer/icons';
import type { AccordionContent, AccordionItem } from './content';

interface AccordionEditorProps {
  block: BlockOf<AccordionContent>;
  onChange: (content: AccordionContent) => void;
}

/**
 * עריכת האקורדיון על הקנבס.
 *
 * בעריכה כל הפריטים פתוחים כברירת מחדל, אחרת היה צריך לפתוח כל פריט
 * כדי לגלות מה כתוב בו. אפשר לקפל פריט כדי לראות את המבנה הכולל.
 */
export function AccordionEditor({ block, onChange }: AccordionEditorProps) {
  const { content } = block;
  const baseId = useId();
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

  const updateItem = (id: string, patch: Partial<AccordionItem>) =>
    onChange({
      ...content,
      items: content.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  const toggle = (id: string) =>
    setCollapsedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  if (content.items.length === 0) {
    return (
      <div className="lc-container">
        <p className="lc-media-placeholder">הוסיפו פריטים בפאנל ההגדרות</p>
      </div>
    );
  }

  return (
    <div className="lc-container">
      <div className="lc-accordion">
        {content.items.map((item, index) => {
          const open = !collapsedIds.includes(item.id);
          const panelId = `${baseId}-p${index}`;

          return (
            <div key={item.id} className="lc-accordion__item" data-open={open || undefined}>
              <div className="lc-accordion__heading">
                <div className="lc-accordion__trigger">
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    aria-label={open ? `סגירת ${item.title}` : `פתיחת ${item.title}`}
                    className="lc-accordion__chevron-button"
                  >
                    <navIcons.ChevronDown className="lc-accordion__chevron" aria-hidden />
                  </button>

                  <InlineText
                    className="lc-accordion__title"
                    ariaLabel="כותרת הפריט"
                    placeholder="שאלה או נושא"
                    value={item.title}
                    singleLine
                    onChange={(title) => updateItem(item.id, { title })}
                  />
                </div>
              </div>

              {open && (
                <div id={panelId} className="lc-accordion__panel">
                  <RichTextEditor
                    doc={item.doc}
                    onChange={(doc: RichTextDoc) => updateItem(item.id, { doc })}
                    placeholder="התשובה או ההסבר…"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
