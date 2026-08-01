import { describe, expect, it } from 'vitest';
import { coerceGeneratedCourse } from './coerceCourse';
import { refineCourse } from './refineCourse';

const richTextBlock = () => ({ type: 'richText', content: {} });

describe('refineCourse', () => {
  it('מוסיפה מסך פתיחה כשהבלוק הראשון אינו hero', () => {
    const { course } = coerceGeneratedCourse({
      title: 'נושא',
      subtitle: 'תת-נושא',
      chapters: [{ blocks: [richTextBlock()] }],
    });

    const { course: refined, warnings } = refineCourse(course);
    const hero = refined.chapters[0].blocks[0];
    expect(hero.type).toBe('hero');
    expect((hero.content as { title: string }).title).toBe('נושא');
    expect(warnings.some((w) => w.includes('פתיחה'))).toBe(true);
  });

  it('לא מכפילה מסך פתיחה כשכבר יש', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [{ blocks: [{ type: 'hero', content: { title: 'קיים' } }, richTextBlock()] }],
    });

    const { course: refined } = refineCourse(course);
    const heroes = refined.chapters[0].blocks.filter((b) => b.type === 'hero');
    expect(heroes).toHaveLength(1);
    expect(refined.chapters[0].blocks[0].type).toBe('hero');
  });

  it('משבצת מפריד בתוך רצף טקסט ארוך, אך לא בסופו', () => {
    const { course } = coerceGeneratedCourse({
      chapters: [
        { blocks: [{ type: 'hero', content: {} }, richTextBlock(), richTextBlock(), richTextBlock(), richTextBlock()] },
      ],
    });

    const { course: refined } = refineCourse(course);
    const types = refined.chapters[0].blocks.map((b) => b.type);
    expect(types).toContain('divider');
    expect(types[types.length - 1]).not.toBe('divider');
  });
});
