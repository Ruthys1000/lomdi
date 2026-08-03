import { useState } from 'react';
import type { BlockOf } from '@/model/types';
import { useRenderContext } from '@/renderer/RenderContext';
import type { ChecklistContent } from './content';

/**
 * צ׳ק-ליסט אינטראקטיבי.
 *
 * אותו רכיב בתצוגה המקדימה ובתוצר — הסימון עובד בשניהם. בעורך (`isEditing`)
 * הסימון מושבת כדי שלחיצה על פריט לא תתחרה בבחירת הבלוק לעריכה. מצב הסימון
 * מקומי ו-ephemeral (מתאפס ברענון), כמו שאלת התרגול.
 */
export function ChecklistRenderer({ block }: { block: BlockOf<ChecklistContent> }) {
  const { content } = block;
  const { isEditing } = useRenderContext();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doneCount = content.items.filter((item) => checked.has(item.id)).length;

  return (
    <div className="lc-container">
      <ul className="lc-checklist">
        {content.items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <li key={item.id} className="lc-checklist__item" data-checked={isChecked || undefined}>
              <label className="lc-checklist__label">
                <input
                  type="checkbox"
                  className="lc-checklist__box"
                  checked={isChecked}
                  disabled={isEditing}
                  onChange={() => toggle(item.id)}
                />
                <span className="lc-control lc-control--check" aria-hidden />
                <span className="lc-checklist__text">
                  <span className="lc-checklist__title">{item.text}</span>
                  {item.description && (
                    <span className="lc-checklist__desc">{item.description}</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {content.showCount && content.items.length > 0 && (
        <p className="lc-checklist__count" role="status" aria-live="polite">
          {doneCount} מתוך {content.items.length} הושלמו
        </p>
      )}
    </div>
  );
}
