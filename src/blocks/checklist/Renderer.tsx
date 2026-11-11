import type { BlockOf } from '@/model/types';
import { useBlockState } from '@/renderer/progress/ProgressContext';
import { useRenderContext } from '@/renderer/RenderContext';
import type { ChecklistContent } from './content';

/**
 * צ׳ק-ליסט אינטראקטיבי.
 *
 * אותו רכיב בתצוגה המקדימה ובתוצר — הסימון עובד בשניהם. בעורך (`isEditing`)
 * הסימון מושבת כדי שלחיצה על פריט לא תתחרה בבחירת הבלוק לעריכה. הסימון
 * נשמר במאגר ההתקדמות (כמערך מזהים, כי `Set` אינו JSON), כך שלומד שחוזר
 * לרשימה אחרי יום ממשיך מהפריט שבו עצר.
 */
export function ChecklistRenderer({ block }: { block: BlockOf<ChecklistContent> }) {
  const { content } = block;
  const { isEditing } = useRenderContext();
  const [checkedIds, setCheckedIds] = useBlockState<string[]>(block.id, NONE);
  const checked = new Set(checkedIds);

  const toggle = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
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

const NONE: string[] = [];
