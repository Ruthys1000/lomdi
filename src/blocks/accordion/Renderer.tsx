import { useId, useState } from 'react';
import type { BlockOf } from '@/model/types';
import { navIcons } from '@/renderer/icons';
import { useRenderContext } from '@/renderer/RenderContext';
import { RichTextView } from '@/renderer/RichTextView';
import type { AccordionContent } from './content';

/**
 * אקורדיון (סעיף 7.6).
 *
 * הנגישות כאן אינה תוספת אלא המבנה עצמו (סעיף 18): הכותרת היא <button>
 * אמיתי ולא div לחיץ, `aria-expanded` מדווח על המצב, `aria-controls`
 * ו-`aria-labelledby` מקשרים בין הכותרת לגוף, והגוף הוא `role="region"`.
 * החץ מסתובב, אבל המידע עצמו עובר גם בלי לראות אותו.
 */
export function AccordionRenderer({ block }: { block: BlockOf<AccordionContent> }) {
  const { content } = block;
  const { isEditing } = useRenderContext();
  const baseId = useId();

  const [openIds, setOpenIds] = useState<string[]>(() =>
    content.openFirstByDefault && content.items[0] ? [content.items[0].id] : [],
  );

  const toggle = (itemId: string) => {
    setOpenIds((current) => {
      if (current.includes(itemId)) return current.filter((id) => id !== itemId);
      // במצב single פתיחת פריט סוגרת את האחרים
      return content.mode === 'single' ? [itemId] : [...current, itemId];
    });
  };

  if (content.items.length === 0) {
    return isEditing ? (
      <div className="lc-container">
        <p className="lc-media-placeholder">הוסיפו פריטים בפאנל ההגדרות</p>
      </div>
    ) : null;
  }

  return (
    <div className="lc-container">
      <div className="lc-accordion">
        {content.items.map((item, index) => {
          const isOpen = openIds.includes(item.id);
          const headerId = `${baseId}-h${index}`;
          const panelId = `${baseId}-p${index}`;

          return (
            <div key={item.id} className="lc-accordion__item" data-open={isOpen || undefined}>
              <h3 className="lc-accordion__heading">
                <button
                  type="button"
                  id={headerId}
                  className="lc-accordion__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                >
                  <navIcons.ChevronDown className="lc-accordion__chevron" aria-hidden />
                  <span className="lc-accordion__title">{item.title || 'פריט ללא כותרת'}</span>
                </button>
              </h3>

              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className="lc-accordion__panel"
                >
                  <RichTextView doc={item.doc} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
