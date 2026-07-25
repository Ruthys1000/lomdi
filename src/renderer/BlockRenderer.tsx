import type { Block } from '@/model/types';
import { blockLabel, blockLabels } from '@/blocks/labels';
import { getRenderer } from '@/blocks/registry.runtime';
import { blockClassName } from './blockClasses';

/**
 * מפנה כל בלוק ל-Renderer שלו לפי הרגיסטרי, ומחיל עליו את הגדרות
 * הפריסה המשותפות (רוחב, יישור, רקע, מרווחים).
 *
 * בלוק מסוג לא מוכר — למשל קובץ פרויקט שנשמר בגרסה חדשה יותר — מדולג
 * בשקט בתוצר ומסומן בעורך. עדיף לומדה חסרת בלוק אחד על פני לומדה שבורה.
 */
export function BlockRenderer({ block, isEditing }: { block: Block; isEditing: boolean }) {
  const Component = getRenderer(block.type);

  if (!Component) {
    if (!isEditing) return null;

    // בלוק מוכר שהתצוגה שלו טרם נבנתה, מול בלוק שהמערכת לא מכירה כלל —
    // שני מצבים שונים לגמרי מבחינת המשתמש, וצריך להבחין ביניהם
    const isKnownType = block.type in blockLabels;

    return (
      <div className="lc-unknown-block" role="note">
        {isKnownType
          ? `בלוק ${blockLabel(block.type)} — התצוגה שלו תתווסף בקרוב`
          : `סוג בלוק שאינו מוכר במערכת: ${block.type}`}
      </div>
    );
  }

  return (
    <div className={blockClassName(block.settings)} data-block-type={block.type}>
      <Component block={block} />
    </div>
  );
}
