import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
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

/** גובה מרזב הצ'רום של הבלוק (ה-pt-7 ב-SortableBlock) ועוד נשימה */
const BLOCK_CHROME_CLEARANCE = 36;

/** מרווח מינימלי מקצה החלון */
const VIEWPORT_MARGIN = 8;

interface Placement {
  top: number;
  left: number;
}

/**
 * הגבול העליון שמעליו אסור לסרגל לצוף.
 *
 * זה אינו קצה החלון: הקנבס גולל בתוך `section` שמתחיל מתחת לסרגל העליון,
 * וסרגל שממוקם לפי החלון בלבד נוחת על שם הפרויקט ועל כפתורי השמירה.
 * מחפשים את אב הגלילה הקרוב ומודדים ממנו.
 */
function scrollParentTop(element: HTMLElement): number {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node.getBoundingClientRect().top;
    }
  }
  return 0;
}

/**
 * מיקום הסרגל הצף.
 *
 * **למה portal ולא `absolute` בתוך הבלוק.** גיליון הקנבס הוא
 * `overflow-hidden` (בשביל הפינות המעוגלות של בלוק הירו), וסרגל שנתלה
 * מעל הבלוק נחתך בו — חצי סרגל, בלי שום דרך ללחוץ על הכפתורים העליונים.
 * `position: fixed` בתוך portal ל-body יוצא מכל הקשר חיתוך שקיים בדרך.
 *
 * **למה מדידה ולא ערך קבוע.** `-top-12` הניח גובה סרגל קבוע. ברגע שהסרגל
 * נעשה צר יותר מהתוכן שלו הוא נשבר לשתי שורות, גדל, ויצא מהמסך כלפי
 * מעלה. כאן הגובה נמדד בפועל, והסרגל מתהפך אל מתחת לבלוק כשאין מקום.
 *
 * ה-scroll נרשם עם `capture: true` כי הקנבס גולל ב-`section` פנימי ולא
 * ב-`window`, ואירוע גלילה של אלמנט אינו עולה בבועה.
 */
function useFloatingPlacement(
  anchorRef: RefObject<HTMLElement | null>,
  toolbarRef: RefObject<HTMLElement | null>,
): Placement | null {
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      const toolbar = toolbarRef.current;
      if (!anchor || !toolbar) return;

      const a = anchor.getBoundingClientRect();
      const t = toolbar.getBoundingClientRect();

      const minTop = Math.max(scrollParentTop(anchor), 0) + VIEWPORT_MARGIN;
      const above = a.top - t.height - BLOCK_CHROME_CLEARANCE;
      const top = above >= minTop ? above : a.bottom + VIEWPORT_MARGIN;

      const centred = a.left + a.width / 2 - t.width / 2;
      const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - t.width - VIEWPORT_MARGIN);
      const left = Math.min(Math.max(centred, VIEWPORT_MARGIN), maxLeft);

      setPlacement((current) =>
        current && current.top === top && current.left === left ? current : { top, left },
      );
    };

    place();

    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);

    const observer = new ResizeObserver(place);
    if (anchorRef.current) observer.observe(anchorRef.current);
    if (toolbarRef.current) observer.observe(toolbarRef.current);

    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      observer.disconnect();
    };
  }, [anchorRef, toolbarRef]);

  return placement;
}

/**
 * עריכת טקסט עשיר בתוך הבלוק עצמו (סעיף 7.2).
 *
 * הכתיבה ל-store מושהית ולא מיידית — כדי שהקלדה רצופה לא תייצר עשרות
 * עדכוני state, ובשלב 4 גם לא עשרות רשומות undo. flush ב-unmount מבטיח
 * שהתו האחרון לא יאבד כשעוברים לבלוק אחר מיד אחרי הקלדה.
 */
export function RichTextEditor({
  doc,
  onChange,
  placeholder = 'כתבו כאן…',
  autoFocus,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const anchorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

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

  const placement = useFloatingPlacement(anchorRef, toolbarRef);

  useEffect(() => {
    return () => {
      commit.flush();
    };
  }, [commit]);

  if (!editor) return null;

  return (
    <div ref={anchorRef} className="lc-rich-text-editor relative">
      <EditorContent editor={editor} />

      {/* הסרגל צף מעל הבלוק כדי לא לדחוף את התוכן ולשנות את מראה הלומדה.
          עד שהמדידה הראשונה מסתיימת הוא יושב מחוץ למסך — הוא חייב להיות
          מרונדר כדי שאפשר יהיה למדוד אותו, ו-useLayoutEffect רץ לפני
          הציור ולכן אין הבהוב */}
      {createPortal(
        <div
          ref={toolbarRef}
          className="fixed z-50"
          style={placement ?? { top: -9999, left: -9999 }}
        >
          <RichTextToolbar editor={editor} />
        </div>,
        document.body,
      )}
    </div>
  );
}
