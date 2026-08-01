import { describe, expect, it } from 'vitest';
import { richTextToPlainText } from '@/model/richText';
import { SCHEMA_VERSION } from '@/model/types';
import { validateProjectFile } from '@/model/validate';
import { coerceGeneratedCourse } from './coerceCourse';

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

function expectValid(course: unknown) {
  const result = validateProjectFile(
    roundTrip({
      version: SCHEMA_VERSION,
      generator: { name: 'לומדי', version: '0.1.0' },
      savedAt: new Date().toISOString(),
      course,
      assets: [],
    }),
  );
  expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true);
}

describe('coerceGeneratedCourse', () => {
  it('הופכת פלט תקין ללומדה תקינה', () => {
    const { course, warnings } = coerceGeneratedCourse({
      title: 'לומדת בדיקה',
      theme: 'vivid',
      chapters: [
        {
          title: 'פרק',
          blocks: [{ type: 'richText', content: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'שלום' }] }] } } }],
        },
      ],
    });

    expect(course.title).toBe('לומדת בדיקה');
    expect(course.theme.preset).toBe('vivid');
    expect(warnings).toHaveLength(0);
    expectValid(course);
  });

  it('משמיטה בלוק מסוג לא מוכר ומדווחת', () => {
    const { course, warnings } = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'carousel', content: {} }, { type: 'richText', content: {} }] }],
    });

    expect(course.chapters[0].blocks).toHaveLength(1);
    expect(course.chapters[0].blocks[0].type).toBe('richText');
    expect(warnings.some((w) => w.includes('carousel'))).toBe(true);
  });

  it('מנקה טקסט עשיר מלוכלך במקום לפסול את הבלוק', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'richText',
              content: {
                doc: {
                  type: 'doc',
                  content: [
                    { type: 'paragraph', content: [{ type: 'text', text: 'נשאר' }] },
                    { type: 'iframe', content: [] },
                  ],
                },
              },
            },
          ],
        },
      ],
    });

    const block = course.chapters[0].blocks[0];
    expect(block.type).toBe('richText');
    expect(richTextToPlainText((block.content as { doc: never }).doc)).toBe('נשאר');
    expectValid(course);
  });

  it('מתקנת שאלה בלי תשובה נכונה ומדווחת', () => {
    const { course, warnings } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'quiz',
              content: {
                question: 'שאלה?',
                options: [{ text: 'א' }, { text: 'ב' }],
              },
            },
          ],
        },
      ],
    });

    const options = (course.chapters[0].blocks[0].content as { options: { correct: boolean }[] }).options;
    expect(options.filter((o) => o.correct)).toHaveLength(1);
    expect(warnings.some((w) => w.includes('תשובה נכונה'))).toBe(true);
    expectValid(course);
  });

  it('מתקנת שאלה עם כמה תשובות נכונות לתשובה אחת', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'quiz',
              content: {
                question: 'שאלה?',
                options: [{ text: 'א', correct: true }, { text: 'ב', correct: true }, { text: 'ג' }],
              },
            },
          ],
        },
      ],
    });

    const options = (course.chapters[0].blocks[0].content as { options: { correct: boolean }[] }).options;
    expect(options.filter((o) => o.correct)).toHaveLength(1);
  });

  it('שדה תוכן פגום חוזר לברירת מחדל בלי לזרוק שדות תקינים', () => {
    const { course, warnings } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'richText',
              content: {
                maxWidth: 'ענק', // לא חוקי → יאופס
                doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'תוכן טוב' }] }] },
              },
            },
          ],
        },
      ],
    });

    const content = course.chapters[0].blocks[0].content as { maxWidth: string; doc: never };
    expect(content.maxWidth).toBe('normal');
    expect(richTextToPlainText(content.doc)).toBe('תוכן טוב');
    expect(warnings.some((w) => w.includes('תוקן'))).toBe(true);
  });

  it('עוטפת בלוקים ברמה העליונה בפרק כשאין chapters', () => {
    const { course } = coerceGeneratedCourse({
      blocks: [{ type: 'richText', content: {} }],
    });

    expect(course.chapters).toHaveLength(1);
    expect(course.chapters[0].blocks[0].type).toBe('richText');
  });

  it('קלט שאינו אובייקט מחזיר לומדה תקינה עם אזהרה', () => {
    const { course, warnings } = coerceGeneratedCourse('לא אובייקט');
    expect(course.chapters.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
    expectValid(course);
  });

  it('מזהים כפולים מה-AI לא מגיעים לתוצר', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          id: 'same',
          blocks: [
            { id: 'dup', type: 'richText', content: {} },
            { id: 'dup', type: 'richText', content: {} },
          ],
        },
      ],
    });

    const ids = course.chapters[0].blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expectValid(course);
  });

  it('שולפת כוונת תמונה ומאפסת את הפניית הנכס', () => {
    const { course, imageIntents } = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'image', content: { query: 'משרד מודרני', alt: 'משרד' } }] }],
    });

    expect(imageIntents).toHaveLength(1);
    expect(imageIntents[0].field).toBe('assetId');
    expect(imageIntents[0].query).toBe('משרד מודרני');
    expect((course.chapters[0].blocks[0].content as { assetId: string }).assetId).toBe('');
    expect((course.chapters[0].blocks[0].content as { alt: string }).alt).toBe('משרד');
  });

  it('שולפת כוונת תמונה מ-hero רק כשהרקע תמונה', () => {
    const withImage = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'hero', content: { backgroundType: 'image', query: 'רקע' } }] }],
    });
    const withGradient = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'hero', content: { backgroundType: 'gradient', query: 'רקע' } }] }],
    });

    expect(withImage.imageIntents).toHaveLength(1);
    expect(withGradient.imageIntents).toHaveLength(0);
  });
});
