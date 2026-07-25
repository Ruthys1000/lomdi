import { useEffect, useMemo, useRef, type ElementType } from 'react';
import { debounce } from '@/lib/debounce';

interface InlineTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  as?: ElementType;
  className?: string;
  /** מונע ירידת שורה — לכותרות ולשדות חד-שורתיים */
  singleLine?: boolean;
  ariaLabel: string;
}

const COMMIT_DELAY = 300;

/**
 * עריכת טקסט פשוט במקום שבו הוא מוצג.
 *
 * שלוש נקודות עדינות ב-contentEditable מטופלות כאן במפורש:
 *
 * 1. הרכיב אינו מבוקר. אילו היינו כותבים את הערך מה-props בכל רינדור,
 *    הסמן היה קופץ לתחילת השורה בכל תו. הערך מסונכרן מבחוץ רק כשהשדה
 *    אינו בפוקוס — כלומר כשהשינוי הגיע ממקום אחר, למשל פאנל ההגדרות.
 * 2. הדבקה מנוקה לטקסט בלבד, אחרת HTML מאתר חיצוני נכנס למסמך.
 * 3. flush ב-unmount, כדי שהתו האחרון לא יאבד במעבר מהיר לבלוק אחר.
 */
export function InlineText({
  value,
  onChange,
  placeholder,
  as: Tag = 'span',
  className,
  singleLine,
  ariaLabel,
}: InlineTextProps) {
  const ref = useRef<HTMLElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const commit = useMemo(
    () => debounce((next: string) => onChangeRef.current(next), COMMIT_DELAY),
    [],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (document.activeElement === element) return;
    if (element.textContent === value) return;
    element.textContent = value;
  }, [value]);

  useEffect(() => () => commit.flush(), [commit]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      className={['lc-inline-text', className].filter(Boolean).join(' ')}
      onInput={(event: React.FormEvent<HTMLElement>) =>
        commit(event.currentTarget.textContent ?? '')
      }
      onBlur={() => commit.flush()}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (singleLine && event.key === 'Enter') {
          event.preventDefault();
          (event.target as HTMLElement).blur();
        }
        if (event.key === 'Escape') (event.target as HTMLElement).blur();
      }}
      onPaste={(event: React.ClipboardEvent) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, singleLine ? text.replace(/\s+/g, ' ') : text);
      }}
    />
  );
}
