import type { ReactNode } from 'react';
import { blockLabel } from '@/blocks/labels';
import { getEditorBlockDefinition } from '@/blocks/registry.editor';
import { cn } from '@/lib/cn';
import type { Block, BlockContent } from '@/model/types';
import { useCourseStore } from '@/state/courseStore';

interface BlockFrameProps {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  /** תוצר ה-Renderer — מה שהלומד יראה */
  children: ReactNode;
}

/**
 * המסגרת שהעורך עוטף בה כל בלוק בקנבס.
 *
 * היא מוזרקת לרנדרר מבחוץ ולא חיה בתוכו, כדי שקוד העריכה יישאר מחוץ
 * לחבילת הלומדה המיוצאת.
 *
 * שני מצבים:
 * - בלוק שאינו נבחר מוצג דרך ה-Renderer, עם שכבה שקופה שתופסת את הלחיצה
 *   ובוחרת אותו. השכבה נחוצה כדי שלחיצה על קישור בתוך הבלוק תבחר אותו
 *   במקום לנווט החוצה.
 * - בלוק נבחר שיש לו EditorComponent מציג אותו במקום ה-Renderer, בלי
 *   השכבה — כדי שאפשר יהיה להקליד ישירות בתוכו. המבנה והקלאסים זהים,
 *   ולכן המראה לא קופץ במעבר בין המצבים.
 */
export function BlockFrame({ block, selected, onSelect, children }: BlockFrameProps) {
  const updateBlockContent = useCourseStore((state) => state.updateBlockContent);
  const definition = getEditorBlockDefinition(block.type);
  const EditorComponent = definition?.EditorComponent;

  const isDirectEditing = selected && Boolean(EditorComponent);

  return (
    <div
      className={cn(
        'group relative transition',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:transition',
        selected
          ? 'before:ring-2 before:ring-blue-500'
          : 'before:ring-1 before:ring-transparent hover:before:ring-slate-300',
      )}
      data-selected={selected || undefined}
    >
      {!isDirectEditing && (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`עריכת בלוק ${blockLabel(block.type)}`}
          className="absolute inset-0 z-10 cursor-pointer"
        />
      )}

      <span
        className={cn(
          'absolute -top-2.5 end-2 z-20 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition',
          selected
            ? 'bg-blue-600 text-white opacity-100'
            : 'bg-slate-700 text-white opacity-0 group-hover:opacity-100',
        )}
      >
        {blockLabel(block.type)}
      </span>

      {isDirectEditing && EditorComponent ? (
        <EditorComponent
          block={block as never}
          onChange={((content: BlockContent) => updateBlockContent(block.id, content)) as never}
        />
      ) : (
        children
      )}
    </div>
  );
}
