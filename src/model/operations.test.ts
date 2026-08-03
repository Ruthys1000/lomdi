import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse, duplicateBlock } from './factory';
import * as ops from './operations';
import type { Course } from './types';

function courseWith(blocksPerChapter: number[]): Course {
  return createCourse({
    chapters: blocksPerChapter.map((count, index) =>
      createChapter({
        title: `פרק ${index + 1}`,
        blocks: Array.from({ length: count }, () => createBlock('richText')),
      }),
    ),
  });
}

const blockIds = (course: Course) => course.chapters.map((c) => c.blocks.map((b) => b.id));

describe('פעולות על פרקים', () => {
  it('מוסיפה פרק במיקום המבוקש', () => {
    const course = courseWith([0, 0]);
    const next = ops.addChapter(course, createChapter({ title: 'באמצע' }), 1);

    expect(next.chapters.map((c) => c.title)).toEqual(['פרק 1', 'באמצע', 'פרק 2']);
  });

  it('מוסיפה בסוף כשלא נמסר אינדקס', () => {
    const course = courseWith([0]);
    const next = ops.addChapter(course, createChapter({ title: 'אחרון' }));

    expect(next.chapters.at(-1)?.title).toBe('אחרון');
  });

  it('משכפלת פרק עם מזהים חדשים לפרק ולכל הבלוקים שבו', () => {
    const course = courseWith([3]);
    const next = ops.duplicateChapterById(course, course.chapters[0].id);

    const [original, copy] = next.chapters;
    expect(next.chapters).toHaveLength(2);
    expect(copy.id).not.toBe(original.id);
    expect(copy.title).toBe('פרק 1 (עותק)');

    const originalIds = original.blocks.map((b) => b.id);
    for (const block of copy.blocks) {
      expect(originalIds).not.toContain(block.id);
    }
  });

  it('ממקמת את העותק מיד אחרי המקור', () => {
    const course = courseWith([0, 0, 0]);
    const next = ops.duplicateChapterById(course, course.chapters[0].id);

    expect(next.chapters[1].title).toBe('פרק 1 (עותק)');
  });

  it('מחזירה את אותו מסמך כשמוחקים פרק שאינו קיים', () => {
    const course = courseWith([1]);
    expect(ops.removeChapter(course, 'chapter-לא-קיים')).toBe(course);
  });

  it('מזיזה פרק ומשמרת את שאר הסדר', () => {
    const course = courseWith([0, 0, 0]);
    const next = ops.moveChapter(course, 0, 2);

    expect(next.chapters.map((c) => c.title)).toEqual(['פרק 2', 'פרק 3', 'פרק 1']);
  });
});

describe('פעולות על בלוקים', () => {
  it('מוסיפה בלוק לפרק המבוקש במיקום המבוקש', () => {
    const course = courseWith([2, 0]);
    const block = createBlock('image');
    const next = ops.addBlock(course, course.chapters[0].id, block, 1);

    expect(next.chapters[0].blocks[1].id).toBe(block.id);
    expect(next.chapters[0].blocks).toHaveLength(3);
  });

  it('מוצאת בלוק ומחזירה את הפרק והאינדקס שלו', () => {
    const course = courseWith([1, 2]);
    const target = course.chapters[1].blocks[1];
    const location = ops.findBlock(course, target.id);

    expect(location?.chapter.id).toBe(course.chapters[1].id);
    expect(location?.blockIndex).toBe(1);
  });

  it('משכפלת בלוק מיד אחרי המקור ומחזירה את המזהה החדש', () => {
    const course = courseWith([2]);
    const source = course.chapters[0].blocks[0];
    const result = ops.duplicateBlockById(course, source.id);

    expect(result.newBlockId).toBeDefined();
    expect(result.newBlockId).not.toBe(source.id);
    expect(result.course.chapters[0].blocks[1].id).toBe(result.newBlockId);
    expect(result.course.chapters[0].blocks).toHaveLength(3);
  });

  it('שכפול בלוק יוצר עותק עמוק ולא הפניה משותפת', () => {
    const block = createBlock('cards');
    const copy = duplicateBlock(block);

    expect(copy.content).not.toBe(block.content);
    expect(copy.content).toEqual(block.content);
  });

  it('מזיזה בלוק בתוך אותו פרק', () => {
    const course = courseWith([3]);
    const [first, second, third] = course.chapters[0].blocks.map((b) => b.id);
    const next = ops.moveBlockWithinChapter(course, course.chapters[0].id, 0, 2);

    expect(blockIds(next)[0]).toEqual([second, third, first]);
  });
});

describe('העברת בלוק בין פרקים', () => {
  it('מסירה מהפרק המקורי ומוסיפה לפרק היעד בפעולה אחת', () => {
    const course = courseWith([2, 1]);
    const moved = course.chapters[0].blocks[0];
    const next = ops.moveBlockToChapter(course, moved.id, course.chapters[1].id, 0);

    expect(next.chapters[0].blocks).toHaveLength(1);
    expect(next.chapters[1].blocks).toHaveLength(2);
    expect(next.chapters[1].blocks[0].id).toBe(moved.id);
  });

  it('לא משאירה את הבלוק בשני פרקים', () => {
    const course = courseWith([2, 1]);
    const moved = course.chapters[0].blocks[1];
    const next = ops.moveBlockToChapter(course, moved.id, course.chapters[1].id, 1);

    const occurrences = ops.allBlocks(next).filter((block) => block.id === moved.id);
    expect(occurrences).toHaveLength(1);
  });

  it('מתקנת את אינדקס היעד כשההעברה היא בתוך אותו פרק', () => {
    const course = courseWith([3]);
    const ids = course.chapters[0].blocks.map((b) => b.id);
    // העברת הראשון לסוף: היעד 3 מתייחס למצב לפני ההסרה
    const next = ops.moveBlockToChapter(course, ids[0], course.chapters[0].id, 3);

    expect(blockIds(next)[0]).toEqual([ids[1], ids[2], ids[0]]);
  });

  it('מתעלמת מפרק יעד שאינו קיים', () => {
    const course = courseWith([1]);
    const blockId = course.chapters[0].blocks[0].id;

    expect(ops.moveBlockToChapter(course, blockId, 'chapter-דמיוני', 0)).toBe(course);
  });
});

describe('הזזת בלוק בצעד אחד', () => {
  it('מזיזה בתוך הפרק כשיש מקום', () => {
    const course = courseWith([3]);
    const ids = course.chapters[0].blocks.map((b) => b.id);
    const next = ops.nudgeBlock(course, ids[0], 1);

    expect(blockIds(next)[0]).toEqual([ids[1], ids[0], ids[2]]);
  });

  it('עוברת לפרק הבא כשהבלוק בתחתית הפרק', () => {
    const course = courseWith([2, 1]);
    const last = course.chapters[0].blocks[1];
    const next = ops.nudgeBlock(course, last.id, 1);

    expect(next.chapters[0].blocks).toHaveLength(1);
    expect(next.chapters[1].blocks[0].id).toBe(last.id);
  });

  it('עוברת לסוף הפרק הקודם כשהבלוק בראש הפרק', () => {
    const course = courseWith([1, 2]);
    const first = course.chapters[1].blocks[0];
    const next = ops.nudgeBlock(course, first.id, -1);

    expect(next.chapters[0].blocks.at(-1)?.id).toBe(first.id);
    expect(next.chapters[1].blocks).toHaveLength(1);
  });

  it('לא עושה דבר בקצה הלומדה', () => {
    const course = courseWith([2]);
    const firstId = course.chapters[0].blocks[0].id;

    expect(ops.nudgeBlock(course, firstId, -1)).toBe(course);
  });
});

describe('אינווריאנטות', () => {
  it('כל המזהים בלומדה ייחודיים אחרי סדרת פעולות', () => {
    let course = courseWith([2, 2]);
    course = ops.duplicateChapterById(course, course.chapters[0].id);
    course = ops.duplicateBlockById(course, course.chapters[0].blocks[0].id).course;
    course = ops.addBlock(course, course.chapters[1].id, createBlock('quiz'));

    const ids = [
      course.id,
      ...course.chapters.map((c) => c.id),
      ...ops.allBlocks(course).map((b) => b.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('פעולה שאינה רלוונטית מחזירה את אותו אובייקט, כדי שלא תיווצר רשומת undo', () => {
    const course = courseWith([1]);

    expect(ops.removeBlock(course, 'block-דמיוני')).toBe(course);
    expect(ops.updateBlockContent(course, 'block-דמיוני', {})).toBe(course);
    expect(ops.moveChapter(course, 0, 0)).toBe(course);
  });
});

describe('ברירות מחדל לפי סוג בלוק', () => {
  it('בלוק כותרת ראשית נולד ברוחב מלא וללא מרווחים', () => {
    const hero = createBlock('hero');

    // רקע מלא-מסך בתוך קונטיינר צר נראה כקופסה צפה, לא ככותרת פתיחה
    expect(hero.settings.width).toBe('full');
    expect(hero.settings.spacingTop).toBe('none');
    expect(hero.settings.spacingBottom).toBe('none');
  });

  it('מפריד נולד ללא מרווחים — הוא עצמו המרווח', () => {
    const divider = createBlock('divider');

    expect(divider.settings.spacingTop).toBe('none');
    expect(divider.settings.spacingBottom).toBe('none');
  });

  it('בלוק רגיל מקבל את הגדרות ברירת המחדל הכלליות', () => {
    const text = createBlock('richText');

    expect(text.settings.width).toBe('normal');
    expect(text.settings.spacingTop).toBe('small');
  });

  it('הגדרות שנמסרו במפורש גוברות על ברירות המחדל של הסוג', () => {
    const hero = createBlock('hero', { settings: { width: 'narrow' } });

    expect(hero.settings.width).toBe('narrow');
    expect(hero.settings.spacingTop).toBe('none');
  });
});
