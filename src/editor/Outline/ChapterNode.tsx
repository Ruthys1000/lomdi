import { useState } from 'react';
import { ChevronDown, ChevronLeft, Copy, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import type { Chapter } from '@/model/types';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { BlockRow } from './BlockRow';

interface ChapterNodeProps {
  chapter: Chapter;
  index: number;
  canDelete: boolean;
  onRequestDelete: () => void;
}

/** פרק בסרגל המבנה, עם הבלוקים שבתוכו ופעולות הפרק */
export function ChapterNode({ chapter, index, canDelete, onRequestDelete }: ChapterNodeProps) {
  const updateChapter = useCourseStore((state) => state.updateChapter);
  const duplicateChapter = useCourseStore((state) => state.duplicateChapter);

  const selectedChapterId = useEditorStore((state) => state.selectedChapterId);
  const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
  const collapsed = useEditorStore((state) => state.collapsedChapterIds.includes(chapter.id));
  const toggleCollapsed = useEditorStore((state) => state.toggleChapterCollapsed);
  const selectChapter = useEditorStore((state) => state.selectChapter);
  const selectBlock = useEditorStore((state) => state.selectBlock);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: chapter.id });

  const [isRenaming, setRenaming] = useState(false);

  const isActiveChapter = selectedChapterId === chapter.id;
  const ChevronIcon = collapsed ? ChevronLeft : ChevronDown;

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-lg px-1.5 py-1.5 transition',
          isDragging && 'opacity-40',
          // סימון ברור שהבלוק ייכנס לראש הפרק הזה
          isOver && 'ring-2 ring-volt',
          isActiveChapter && !selectedBlockId ? 'bg-volt-soft' : 'hover:bg-app',
        )}
      >
        <button
          type="button"
          aria-label={`גרירת הפרק ${chapter.title}`}
          className="cursor-grab rounded p-0.5 text-fg-muted opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 hover:text-fg-soft active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => toggleCollapsed(chapter.id)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `פתיחת הפרק ${chapter.title}` : `סגירת הפרק ${chapter.title}`}
          className="rounded p-0.5 text-fg-muted hover:text-fg-soft"
        >
          <ChevronIcon className="size-4" aria-hidden />
        </button>

        <span className="w-5 shrink-0 text-center text-xs font-semibold text-fg-muted tabular-nums">
          {index + 1}
        </span>

        {isRenaming ? (
          <input
            autoFocus
            defaultValue={chapter.title}
            aria-label="שם הפרק"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value) updateChapter(chapter.id, { title: value });
              setRenaming(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') setRenaming(false);
            }}
            className="min-w-0 flex-1 rounded border border-volt-dim px-1.5 py-0.5 text-sm focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => selectChapter(chapter.id)}
            onDoubleClick={() => setRenaming(true)}
            className={cn(
              'min-w-0 flex-1 truncate text-start text-sm',
              isActiveChapter ? 'font-semibold text-volt' : 'text-fg-soft',
            )}
          >
            {chapter.title || 'פרק ללא שם'}
          </button>
        )}

        {/* הפעולות מופיעות בריחוף, אבל נשארות נגישות במקלדת דרך focus-within */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <OutlineAction icon={Pencil} label="שינוי שם" onClick={() => setRenaming(true)} />
          <OutlineAction icon={Copy} label="שכפול פרק" onClick={() => duplicateChapter(chapter.id)} />
          <OutlineAction
            icon={Trash2}
            label={canDelete ? 'מחיקת פרק' : 'לא ניתן למחוק את הפרק האחרון'}
            onClick={onRequestDelete}
            disabled={!canDelete}
            destructive
          />
        </div>
      </div>

      {!collapsed && (
        <ul className="mt-0.5 mb-1 space-y-0.5 ps-6">
          {chapter.blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              selected={selectedBlockId === block.id}
              onSelect={() => selectBlock(block.id, chapter.id)}
            />
          ))}

          {chapter.blocks.length === 0 && (
            <li className="px-2 py-1 text-xs text-fg-muted">פרק ריק</li>
          )}
        </ul>
      )}
    </li>
  );
}

function OutlineAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'rounded p-1 transition disabled:cursor-not-allowed disabled:opacity-30',
        destructive
          ? 'text-fg-muted hover:bg-danger-soft hover:text-danger'
          : 'text-fg-muted hover:bg-edge hover:text-fg-soft',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}
