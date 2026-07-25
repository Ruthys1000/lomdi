import { Fragment, type ReactNode } from 'react';
import type { RichTextMark, RichTextNode } from '@/model/types';

/**
 * ממיר מסמך ProseMirror (JSON) ל-React.
 *
 * זהו גבול האבטחה של התוכן, והסיבה שאין בפרויקט dangerouslySetInnerHTML
 * ואין DOMPurify בזמן ריצה: כל node ו-mark שאינם ברשימה הלבנה כאן פשוט
 * אינם מקבלים ייצוג. גם קובץ פרויקט שנערך ידנית ומכיל <script> או
 * onerror לא יכול לייצר אלמנט כזה — אין נתיב בקוד שממיר מחרוזת ל-HTML.
 *
 * המחיר: כל פורמט חדש בסרגל העריכה מחייב שורה גם כאן. זה מכוון —
 * מה שאפשר לכתוב ומה שאפשר להציג נשארים מסונכרנים.
 */

/** רק סכמות שאינן מאפשרות הרצת קוד. javascript: ו-data: נחסמים. */
const SAFE_LINK = /^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;

function safeHref(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return SAFE_LINK.test(trimmed) ? trimmed : undefined;
}

/** צבע טקסט מוגבל לערכים מפורשים — לא מחרוזת CSS חופשית */
function safeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return /^(#[0-9a-fA-F]{3,8}|var\(--lc-color-[a-z-]+\))$/.test(value.trim())
    ? value.trim()
    : undefined;
}

function applyMarks(content: ReactNode, marks: RichTextMark[] | undefined, keyBase: string): ReactNode {
  if (!marks?.length) return content;

  return marks.reduce<ReactNode>((wrapped, mark, index) => {
    const key = `${keyBase}-m${index}`;

    switch (mark.type) {
      case 'bold':
        return <strong key={key}>{wrapped}</strong>;
      case 'italic':
        return <em key={key}>{wrapped}</em>;
      case 'underline':
        return <u key={key}>{wrapped}</u>;
      case 'strike':
        return <s key={key}>{wrapped}</s>;
      case 'textStyle': {
        const color = safeColor(mark.attrs?.color);
        return color ? (
          <span key={key} style={{ color }}>
            {wrapped}
          </span>
        ) : (
          wrapped
        );
      }
      case 'link': {
        const href = safeHref(mark.attrs?.href);
        if (!href) return wrapped;
        const external = /^https?:/i.test(href);
        return (
          <a
            key={key}
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {wrapped}
          </a>
        );
      }
      default:
        // mark שאינו מוכר מוותר על העיצוב אבל שומר על הטקסט
        return wrapped;
    }
  }, content);
}

function renderNode(node: RichTextNode, key: string): ReactNode {
  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`));

  switch (node.type) {
    case 'text':
      return <Fragment key={key}>{applyMarks(node.text ?? '', node.marks, key)}</Fragment>;

    case 'paragraph':
      return <p key={key}>{children}</p>;

    case 'heading': {
      const level = Number(node.attrs?.level);
      const Tag = ({ 2: 'h2', 3: 'h3', 4: 'h4' } as const)[level as 2 | 3 | 4] ?? 'h3';
      return <Tag key={key}>{children}</Tag>;
    }

    case 'bulletList':
      return <ul key={key}>{children}</ul>;

    case 'orderedList':
      return <ol key={key}>{children}</ol>;

    case 'listItem':
      return <li key={key}>{children}</li>;

    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;

    case 'hardBreak':
      return <br key={key} />;

    case 'doc':
      return <Fragment key={key}>{children}</Fragment>;

    default:
      // סוג לא מוכר: התוכן שבתוכו עדיין מוצג, כדי לא לאבד טקסט
      return <Fragment key={key}>{children}</Fragment>;
  }
}

export function RichTextView({ doc, className }: { doc: RichTextNode; className?: string }) {
  return <div className={className ? `lc-prose ${className}` : 'lc-prose'}>{renderNode(doc, 'n')}</div>;
}
