import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import * as ops from '@/model/operations';
import type { Course } from '@/model/types';
import { flattenOutline, resolveDrop } from './outlineDnd';

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

describe('flattenOutline', () => {
  it('משטח פרקים ובלוקים לרשימה אחת בסדר התצוגה', () => {
    const course = courseWith([2, 1]);
    const items = flattenOutline(course, []);

    expect(items.map((item) => item.kind)).toEqual([
      'chapter',
      'block',
      'block',
      'chapter',
      'block',
    ]);
  });

  it('מדלג על הבלוקים של פרק סגור', () => {
    const course = courseWith([2, 1]);
    const items = flattenOutline(course, [course.chapters[0].id]);

    expect(items.map((item) => item.kind)).toEqual(['chapter', 'chapter', 'block']);
  });

  it('שומר על מזהים ייחודיים ברשימה — דרישה של dnd-kit', () => {
    const course = courseWith([3, 3]);
    const ids = flattenOutline(course, []).map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resolveDrop', () => {
  it('מזהה שינוי סדר פרקים', () => {
    const course = courseWith([1, 1, 1]);
    const items = flattenOutline(course, []);

    const result = resolveDrop(items, course.chapters[0].id, course.chapters[2].id);

    expect(result).toEqual({ type: 'moveChapter', from: 0, to: 2 });
  });

  it('מתעלם מגרירת פרק אל בלוק — פעולה חסרת משמעות', () => {
    const course = courseWith([2, 1]);
    const items = flattenOutline(course, []);

    const result = resolveDrop(items, course.chapters[0].id, course.chapters[0].blocks[1].id);

    expect(result.type).toBe('none');
  });

  it('שחרור בלוק על כותרת פרק מכניס אותו בראש הפרק', () => {
    const course = courseWith([2, 1]);
    const items = flattenOutline(course, []);
    const moved = course.chapters[0].blocks[0];

    const result = resolveDrop(items, moved.id, course.chapters[1].id);

    expect(result).toEqual({
      type: 'moveBlock',
      blockId: moved.id,
      targetChapterId: course.chapters[1].id,
      targetIndex: 0,
    });
  });

  it('מעביר בלוק בין פרקים למיקום הבלוק שעליו שוחרר', () => {
    const course = courseWith([1, 2]);
    const items = flattenOutline(course, []);
    const moved = course.chapters[0].blocks[0];

    const result = resolveDrop(items, moved.id, course.chapters[1].blocks[1].id);

    expect(result).toEqual({
      type: 'moveBlock',
      blockId: moved.id,
      targetChapterId: course.chapters[1].id,
      targetIndex: 1,
    });
  });

  it('מחזיר none כשמשחררים במקום המקורי', () => {
    const course = courseWith([2]);
    const items = flattenOutline(course, []);
    const blockId = course.chapters[0].blocks[0].id;

    expect(resolveDrop(items, blockId, blockId).type).toBe('none');
  });
});

/**
 * הבדיקות הבאות מריצות את התוצאה דרך המודל עצמו. תרגום נכון של הגרירה
 * הוא רק חצי מהעניין — מה שחשוב הוא הסדר שהמשתמש רואה בסוף.
 */
describe('resolveDrop יחד עם המודל', () => {
  const apply = (course: Course, activeId: string, overId: string): Course => {
    const result = resolveDrop(flattenOutline(course, []), activeId, overId);

    switch (result.type) {
      case 'moveChapter':
        return ops.moveChapter(course, result.from, result.to);
      case 'moveBlock':
        return ops.moveBlockToChapter(
          course,
          result.blockId,
          result.targetChapterId,
          result.targetIndex,
        );
      default:
        return course;
    }
  };

  it('גרירת בלוק כלפי מטה בתוך פרק ממקמת אותו אחרי היעד', () => {
    const course = courseWith([3]);
    const [first, second, third] = course.chapters[0].blocks.map((block) => block.id);

    const next = apply(course, first, second);

    expect(next.chapters[0].blocks.map((block) => block.id)).toEqual([second, first, third]);
  });

  it('גרירת בלוק כלפי מעלה בתוך פרק ממקמת אותו במקום היעד', () => {
    const course = courseWith([3]);
    const [first, second, third] = course.chapters[0].blocks.map((block) => block.id);

    const next = apply(course, third, first);

    expect(next.chapters[0].blocks.map((block) => block.id)).toEqual([third, first, second]);
  });

  it('גרירת בלוק לפרק אחר מוציאה אותו מהפרק המקורי', () => {
    const course = courseWith([2, 1]);
    const moved = course.chapters[0].blocks[1].id;

    const next = apply(course, moved, course.chapters[1].blocks[0].id);

    expect(next.chapters[0].blocks).toHaveLength(1);
    expect(next.chapters[1].blocks.map((block) => block.id)[0]).toBe(moved);
    expect(ops.allBlocks(next).filter((block) => block.id === moved)).toHaveLength(1);
  });

  it('שינוי סדר פרקים שומר על הבלוקים שבתוכם', () => {
    const course = courseWith([2, 1]);
    const firstChapterBlocks = course.chapters[0].blocks.map((block) => block.id);

    const next = apply(course, course.chapters[0].id, course.chapters[1].id);

    expect(next.chapters[1].blocks.map((block) => block.id)).toEqual(firstChapterBlocks);
  });
});
