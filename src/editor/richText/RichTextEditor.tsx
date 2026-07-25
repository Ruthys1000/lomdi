import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { debounce } from '@/lib/debounce';
import type { RichTextDoc } from '@/model/types';
import { richTextExtensions } from './extensions';
import { RichTextToolbar } from './RichTextToolbar';

interface RichTextEditorProps {
  doc: RichTextDoc;
  onChange: (doc: RichTextDoc) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** השהיה לפני כתיבה ל-store: מקבצת הקלדה רצופה לשינוי אחד */
const COMMIT_DELAY = 300;

/**
 * עריכת טקסט עשיר בתוך הבלוק עצמו (סעיף 7.2).
 *
 * הכתיבה ל-store מושהית ולא מיידית — כדי שהקלדה רצופה לא תייצר עשרות
 * עדכוני state, ובשלב 4 גם לא עשרות רשומות undo. flush ב-unmount מבטיח
 * שהתו האחרון לא יאבד כשעוברים לבלוק אחר מיד אחרי הקלדה.
 */
export function RichTextEditor({ doc, onChange, placeholder = 'כתבו כאן…', autoFocus }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const commit = useMemo(
    () => debounce((next: RichTextDoc) => onChangeRef.current(next), COMMIT_DELAY),
    [],
  );

  const editor = useEditor({
    extensions: richTextExtensions(placeholder),
    content: doc,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'lc-prose focus:outline-none',
        // מיותר בעברית אבל נכון כשהלומדה באנגלית — התוכן יורש את כיוון הלומדה
        dir: 'auto',
      },
    },
    onUpdate: ({ editor: instance }) => commit(instance.getJSON() as RichTextDoc),
  });

  useEffect(() => {
    return () => {
      commit.flush();
    };
  }, [commit]);

  if (!editor) return null;

  return (
    <div className="lc-rich-text-editor relative">
      {/* הסרגל צף מעל הבלוק כדי לא לדחוף את התוכן ולשנות את מראה הלומדה */}
      <div className="pointer-events-none absolute -top-12 z-30 start-0 end-0 flex justify-center">
        <div className="pointer-events-auto">
          <RichTextToolbar editor={editor} />
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
