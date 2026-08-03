import { InlineText } from '@/editor/inline/InlineText';
import type { BlockOf } from '@/model/types';
import type { ChecklistContent, ChecklistItem } from './content';

interface ChecklistEditorProps {
  block: BlockOf<ChecklistContent>;
  onChange: (content: ChecklistContent) => void;
}

/**
 * עריכת הצ׳ק-ליסט על הקנבס. המבנה זהה ל-Renderer, ולכן המראה אינו קופץ.
 * תיבות הסימון מוצגות מושבתות (העריכה היא של הטקסט, לא של מצב הסימון).
 * הוספה/מחיקה/סידור בפאנל ההגדרות.
 */
export function ChecklistEditor({ block, onChange }: ChecklistEditorProps) {
  const { content } = block;

  const updateItem = (id: string, patch: Partial<ChecklistItem>) =>
    onChange({
      ...content,
      items: content.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="lc-container">
      <ul className="lc-checklist">
        {content.items.map((item) => (
          <li key={item.id} className="lc-checklist__item">
            <label className="lc-checklist__label">
              <input type="checkbox" className="lc-checklist__box" disabled checked={false} readOnly />
              <span className="lc-control lc-control--check" aria-hidden />
              <span className="lc-checklist__text">
                <InlineText
                  as="span"
                  className="lc-checklist__title"
                  ariaLabel="טקסט הפריט"
                  placeholder="פריט לבדיקה"
                  value={item.text}
                  singleLine
                  onChange={(text) => updateItem(item.id, { text })}
                />
                <InlineText
                  as="span"
                  className="lc-checklist__desc"
                  ariaLabel="תיאור הפריט"
                  placeholder="תיאור קצר (לא חובה)"
                  value={item.description}
                  singleLine
                  onChange={(description) => updateItem(item.id, { description })}
                />
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
