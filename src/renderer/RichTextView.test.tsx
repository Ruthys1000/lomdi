import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RichTextNode } from '@/model/types';
import { RichTextView } from './RichTextView';

const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content });
const text = (value: string, marks?: RichTextNode['marks']): RichTextNode => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});
const para = (...content: RichTextNode[]): RichTextNode => ({ type: 'paragraph', content });

function html(node: RichTextNode): string {
  const { container } = render(<RichTextView doc={node} />);
  return container.innerHTML;
}

describe('RichTextView — רינדור', () => {
  it('מרנדר פסקאות וכותרות ברמה הנכונה', () => {
    const out = html(
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('כותרת')] },
        para(text('פסקה')),
      ),
    );

    expect(out).toContain('<h2>כותרת</h2>');
    expect(out).toContain('<p>פסקה</p>');
  });

  it('מגביל כותרות לרמות שהעורך מציע', () => {
    // level 1 שמור לכותרת הלומדה; ערך חריג נופל לברירת מחדל ולא שובר
    expect(html(doc({ type: 'heading', attrs: { level: 1 }, content: [text('א')] }))).toContain('<h3>');
    expect(html(doc({ type: 'heading', attrs: { level: 9 }, content: [text('א')] }))).toContain('<h3>');
  });

  it('מרנדר רשימות וציטוט', () => {
    const out = html(
      doc(
        { type: 'bulletList', content: [{ type: 'listItem', content: [para(text('פריט'))] }] },
        { type: 'blockquote', content: [para(text('ציטוט'))] },
      ),
    );

    expect(out).toContain('<ul><li><p>פריט</p></li></ul>');
    expect(out).toContain('<blockquote><p>ציטוט</p></blockquote>');
  });

  it('מחיל סימוני עיצוב מקוננים', () => {
    const out = html(doc(para(text('מודגש', [{ type: 'bold' }, { type: 'italic' }]))));

    expect(out).toContain('<em><strong>מודגש</strong></em>');
  });
});

describe('RichTextView — גבול האבטחה', () => {
  it('לא מייצר אלמנט מסוג node שאינו ברשימה הלבנה, אך שומר על הטקסט', () => {
    const out = html(
      doc({ type: 'script', content: [text('alert(1)')] } as RichTextNode),
    );

    expect(out).not.toContain('<script');
    expect(out).toContain('alert(1)');
  });

  it('מתייחס לטקסט כטקסט ולא כ-HTML', () => {
    const out = html(doc(para(text('<img src=x onerror=alert(1)>'))));

    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    '  javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
  ])('חוסם קישור מסוכן: %s', (href) => {
    const out = html(doc(para(text('לחצו', [{ type: 'link', attrs: { href } }]))));

    expect(out).not.toContain('<a');
    // הטקסט נשמר גם כשהקישור נדחה — לא מאבדים תוכן
    expect(out).toContain('לחצו');
  });

  it.each(['https://example.com', 'mailto:a@b.com', 'tel:0501234567', '#anchor', '/relative'])(
    'מתיר קישור בטוח: %s',
    (href) => {
      const out = html(doc(para(text('לחצו', [{ type: 'link', attrs: { href } }]))));
      expect(out).toContain(`href="${href}"`);
    },
  );

  it('מוסיף rel=noopener לקישורים חיצוניים בלבד', () => {
    const external = html(
      doc(para(text('חוץ', [{ type: 'link', attrs: { href: 'https://example.com' } }]))),
    );
    const internal = html(doc(para(text('פנים', [{ type: 'link', attrs: { href: '#x' } }]))));

    expect(external).toContain('rel="noopener noreferrer"');
    expect(internal).not.toContain('rel=');
  });

  it('מתיר צבע טקסט רק בפורמט מוכר', () => {
    const valid = html(doc(para(text('צבע', [{ type: 'textStyle', attrs: { color: '#ff0000' } }]))));
    const invalid = html(
      doc(para(text('זדוני', [{ type: 'textStyle', attrs: { color: 'red; background:url(javascript:1)' } }]))),
    );

    expect(valid).toContain('color: rgb(255, 0, 0)');
    expect(invalid).not.toContain('background');
  });

  it('מתעלם מ-mark שאינו מוכר ושומר על הטקסט', () => {
    const out = html(doc(para(text('טקסט', [{ type: 'onclick', attrs: { handler: 'alert(1)' } }]))));

    expect(out).toContain('טקסט');
    expect(out).not.toContain('alert');
  });
});
