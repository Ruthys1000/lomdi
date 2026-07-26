import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/cn';

/**
 * סרגל העריכה של הטקסט העשיר.
 *
 * onMouseDown עם preventDefault בכל כפתור: בלעדיו הלחיצה מוציאה את
 * הפוקוס מהעורך, הבחירה נמחקת, והפורמט מוחל על כלום.
 */
export function RichTextToolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('כתובת הקישור', previous ?? 'https://');

    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-sand-200 bg-white p-1 shadow-sm">
      <ToolbarButton
        icon={Bold}
        label="מודגש"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="נטוי"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label="קו תחתון"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />

      <Separator />

      <ToolbarButton
        icon={Heading2}
        label="כותרת"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label="כותרת משנה"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <Separator />

      <ToolbarButton
        icon={List}
        label="רשימה"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="רשימה ממוספרת"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quote}
        label="ציטוט"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />

      <Separator />

      <ToolbarButton
        icon={editor.isActive('link') ? Link2Off : Link2}
        label={editor.isActive('link') ? 'עריכת קישור' : 'הוספת קישור'}
        active={editor.isActive('link')}
        onClick={setLink}
      />
    </div>
  );
}

function Separator() {
  return <span className="mx-0.5 h-5 w-px bg-sand-200" aria-hidden />;
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'rounded p-1.5 transition',
        active ? 'bg-clay-100 text-clay-700' : 'text-sand-500 hover:bg-sand-100 hover:text-sand-900',
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
