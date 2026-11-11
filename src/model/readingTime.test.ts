import { describe, expect, it } from 'vitest';
import { createBlock, createChapter } from './factory';
import { blockWordCount, chapterMinutes } from './readingTime';
import type { Block } from './types';

const textBlock = (words: number): Block => ({
  ...createBlock('richText'),
  content: {
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: 'start' },
          content: [{ type: 'text', text: Array(words).fill('מילה').join(' ') }],
        },
      ],
    },
  },
});

describe('readingTime', () => {
  it('סופר רק טקסט שהלומד קורא, לא מזהים, כתובות או ערכי תצורה', () => {
    const block: Block = {
      ...createBlock('richText'),
      content: {
        id: 'block one two',
        variant: 'panel wide',
        url: 'https://example.com/a b c',
        title: 'שלוש מילים בדיוק',
        items: [{ id: 'item x', text: 'עוד שתיים' }],
      },
    };
    expect(blockWordCount(block)).toBe(5);
  });

  it('פרק ריק הוא 0 דקות, ופרק עם תוכן הוא לפחות דקה', () => {
    expect(chapterMinutes(createChapter({ title: 'ריק' }))).toBe(0);
    expect(chapterMinutes({ ...createChapter(), blocks: [textBlock(3)] })).toBe(1);
  });

  it('האומדן גדל עם כמות הטקסט ועם בלוקים שדורשים מענה', () => {
    const reading = { ...createChapter(), blocks: [textBlock(540)] };
    expect(chapterMinutes(reading)).toBe(3);

    const withQuestions = {
      ...createChapter(),
      blocks: [textBlock(540), createBlock('quiz'), createBlock('quiz')],
    };
    expect(chapterMinutes(withQuestions)).toBeGreaterThan(chapterMinutes(reading));
  });
});
