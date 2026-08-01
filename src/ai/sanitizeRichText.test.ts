import { describe, expect, it } from 'vitest';
import { richTextToPlainText } from '@/model/richText';
import { sanitizeRichText } from './sanitizeRichText';

describe('sanitizeRichText', () => {
  it('שומרת nodes ו-marks מוכרים', () => {
    const { doc, changed } = sanitizeRichText({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'שלום', marks: [{ type: 'bold' }] }],
        },
      ],
    });

    expect(changed).toBe(false);
    expect(richTextToPlainText(doc)).toBe('שלום');
    expect(doc.content?.[0].content?.[0].marks?.[0].type).toBe('bold');
  });

  it('משמיטה node לא מוכר ומדליקה changed, בלי להפיל את השאר', () => {
    const { doc, changed } = sanitizeRichText({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'נשאר' }] },
        { type: 'table', content: [{ type: 'text', text: 'נעלם' }] },
      ],
    });

    expect(changed).toBe(true);
    expect(richTextToPlainText(doc)).toBe('נשאר');
  });

  it('משמיטה mark לא מוכר אך שומרת את הטקסט', () => {
    const { doc, changed } = sanitizeRichText({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'טקסט', marks: [{ type: 'highlight' }] }] }],
    });

    expect(changed).toBe(true);
    expect(richTextToPlainText(doc)).toBe('טקסט');
    expect(doc.content?.[0].content?.[0].marks).toBeUndefined();
  });

  it('עוטפת מחרוזת חלקה כפסקה', () => {
    const { doc } = sanitizeRichText('סתם טקסט');
    expect(richTextToPlainText(doc)).toBe('סתם טקסט');
  });

  it('מצמידה רמת כותרת לא חוקית לטווח 2–4', () => {
    const { doc } = sanitizeRichText({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'כותרת' }] }],
    });

    expect(doc.content?.[0].attrs).toEqual({ level: 2 });
  });

  it('קלט לא תקין לגמרי מחזיר מסמך ריק תקין', () => {
    const { doc } = sanitizeRichText(42);
    expect(doc.type).toBe('doc');
    expect(richTextToPlainText(doc)).toBe('');
  });
});
