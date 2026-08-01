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

describe('coerceGeneratedCourse — visualStyle', () => {
  it('מכבד visualStyle תקין שהגיע מ-AI', () => {
    const { visualStyle } = coerceGeneratedCourse({
      theme: 'vivid',
      visualStyle: { artStyle: 'watercolor', palette: ['#abcdef'], motif: 'waves' },
      chapters: [],
    });
    expect(visualStyle.artStyle).toBe('watercolor');
    expect(visualStyle.palette).toEqual(['#abcdef']);
    expect(visualStyle.motif).toBe('waves');
  });

  it('גוזר brief מהערכה כשהמודל השמיט אותו', () => {
    const { course, visualStyle } = coerceGeneratedCourse({ theme: 'forest', chapters: [] });
    expect(visualStyle.artStyle).toBeTruthy();
    // הפלטה מתלכדת עם צבעי ה-theme של הלומדה
    expect(visualStyle.palette).toContain(course.theme.colors.primary);
  });
});

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

  it('שומרת תוכן כרטיסים מה-AI גם בלי id/button', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'cards',
              content: {
                columns: 2,
                items: [
                  { icon: 'ShieldCheck', title: 'דיווח', text: 'מדווחים על מפגע.' },
                  { icon: 'Flame', title: 'כיבוי אש', text: 'מכירים את המטפים.' },
                ],
              },
            },
          ],
        },
      ],
    });

    const content = course.chapters[0].blocks[0].content as {
      items: { id: string; title: string; text: string; icon: string; button: unknown }[];
    };
    expect(content.items).toHaveLength(2);
    expect(content.items.map((i) => i.title)).toEqual(['דיווח', 'כיבוי אש']);
    expect(content.items[0].text).toBe('מדווחים על מפגע.');
    expect(content.items[0].icon).toBe('ShieldCheck');
    expect(content.items.every((i) => i.id && i.button)).toBe(true);
    expect(new Set(content.items.map((i) => i.id)).size).toBe(2);
    expectValid(course);
  });

  it('שומרת וריאציה ו-settings.background שהמודל שולח (מקצב חזותי)', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'cards',
              settings: { background: 'gradientSoft' },
              content: {
                variant: 'gradient',
                items: [{ icon: 'Target', title: 'כותרת', text: 'טקסט' }],
              },
            },
          ],
        },
      ],
    });

    const block = course.chapters[0].blocks[0];
    expect((block.content as { variant: string }).variant).toBe('gradient');
    expect(block.settings.background).toBe('gradientSoft');
    expectValid(course);
  });

  it('שומרת ערכי stats מה-AI גם בלי id', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'stats',
              content: {
                items: [
                  { value: '+40%', label: 'שיפור', sub: 'בשנה האחרונה' },
                  { value: '24/7', label: 'זמינות', sub: 'לאורך כל השבוע' },
                ],
              },
            },
          ],
        },
      ],
    });

    const content = course.chapters[0].blocks[0].content as {
      items: { id: string; value: string; label: string }[];
    };
    expect(content.items.map((i) => i.value)).toEqual(['+40%', '24/7']);
    expect(content.items.map((i) => i.label)).toEqual(['שיפור', 'זמינות']);
    expect(content.items.every((i) => i.id)).toBe(true);
    expectValid(course);
  });

  it('שומרת פריטי accordion מה-AI כולל ה-doc', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        {
          blocks: [
            {
              type: 'accordion',
              content: {
                items: [
                  {
                    title: 'מה עושים?',
                    doc: {
                      type: 'doc',
                      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'פונים לממונה.' }] }],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const content = course.chapters[0].blocks[0].content as {
      items: { id: string; title: string; doc: never }[];
    };
    expect(content.items).toHaveLength(1);
    expect(content.items[0].title).toBe('מה עושים?');
    expect(content.items[0].id).toBeTruthy();
    expect(richTextToPlainText(content.items[0].doc)).toBe('פונים לממונה.');
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

  it('נופלת ל-alt כשאילתה כשהמודל השמיט query', () => {
    const { imageIntents } = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'image', content: { alt: 'משרד מודרני ומסודר' } }] }],
    });

    expect(imageIntents).toHaveLength(1);
    expect(imageIntents[0].query).toBe('משרד מודרני ומסודר');
    expect(imageIntents[0].alt).toBe('משרד מודרני ומסודר');
  });

  it('מעדיפה query מפורש על פני ה-alt', () => {
    const { imageIntents } = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'image', content: { query: 'modern office', alt: 'משרד' } }] }],
    });

    expect(imageIntents[0].query).toBe('modern office');
  });

  it('נופלת ל-caption כשאין query ואין alt', () => {
    const { imageIntents } = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'image', content: { caption: 'צוות עובד יחד' } }] }],
    });

    expect(imageIntents).toHaveLength(1);
    expect(imageIntents[0].query).toBe('צוות עובד יחד');
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
