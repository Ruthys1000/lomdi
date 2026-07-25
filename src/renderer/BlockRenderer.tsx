import type { Block } from '@/model/types';
import { getRenderer } from '@/blocks/registry.runtime';

/**
 * מפנה כל בלוק ל-Renderer שלו לפי הרגיסטרי.
 * בלוק מסוג לא מוכר (למשל קובץ פרויקט מגרסה חדשה יותר) מדולג בשקט
 * בתוצר, ומסומן בבירור בעורך.
 */
export function BlockRenderer({ block, isEditing }: { block: Block; isEditing: boolean }) {
  const Component = getRenderer(block.type);

  if (!Component) {
    if (!isEditing) return null;
    return (
      <div className="lc-unknown-block" role="note">
        סוג בלוק שאינו מוכר במערכת: <code>{block.type}</code>
      </div>
    );
  }

  return <Component block={block} />;
}
