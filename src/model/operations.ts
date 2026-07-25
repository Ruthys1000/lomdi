import { duplicateBlock, duplicateChapter } from './factory';
import type { Block, BlockContent, BlockSettings, Chapter, Course } from './types';

/**
 * כל הפעולות על מסמך הלומדה, כפונקציות טהורות.
 *
 * הן לא נוגעות ב-state ולא ב-React, ולכן אפשר לבדוק אותן ישירות — וזה
 * המקום שבו נשמרות האינווריאנטות של המודל (מזהים ייחודיים, אינדקסים
 * בתחום, בלוק שייך לפרק אחד בלבד).
 *
 * כל פונקציה מחזירה מסמך חדש, ומחזירה את המסמך המקורי ללא שינוי כאשר
 * הפעולה אינה רלוונטית — כך שינוי מיותר לא מייצר רשומת undo מיותרת.
 */

// ─────────────────────────── איתור ───────────────────────────

export interface BlockLocation {
  chapter: Chapter;
  chapterIndex: number;
  block: Block;
  blockIndex: number;
}

export function findBlock(course: Course, blockId: string): BlockLocation | undefined {
  for (let chapterIndex = 0; chapterIndex < course.chapters.length; chapterIndex++) {
    const chapter = course.chapters[chapterIndex];
    const blockIndex = chapter.blocks.findIndex((block) => block.id === blockId);
    if (blockIndex !== -1) {
      return { chapter, chapterIndex, block: chapter.blocks[blockIndex], blockIndex };
    }
  }
  return undefined;
}

export function findChapter(course: Course, chapterId: string): Chapter | undefined {
  return course.chapters.find((chapter) => chapter.id === chapterId);
}

export function chapterIndexOf(course: Course, chapterId: string): number {
  return course.chapters.findIndex((chapter) => chapter.id === chapterId);
}

export function allBlocks(course: Course): Block[] {
  return course.chapters.flatMap((chapter) => chapter.blocks);
}

// ─────────────────────────── עוזרים ───────────────────────────

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function withChapters(course: Course, chapters: Chapter[]): Course {
  return { ...course, chapters };
}

function mapChapter(course: Course, chapterId: string, fn: (chapter: Chapter) => Chapter): Course {
  let changed = false;
  const chapters = course.chapters.map((chapter) => {
    if (chapter.id !== chapterId) return chapter;
    changed = true;
    return fn(chapter);
  });
  return changed ? withChapters(course, chapters) : course;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(clamp(to, 0, next.length), 0, moved);
  return next;
}

// ─────────────────────────── פרקים ───────────────────────────

export function addChapter(course: Course, chapter: Chapter, atIndex?: number): Course {
  const index = atIndex === undefined ? course.chapters.length : clamp(atIndex, 0, course.chapters.length);
  const chapters = [...course.chapters];
  chapters.splice(index, 0, chapter);
  return withChapters(course, chapters);
}

export function removeChapter(course: Course, chapterId: string): Course {
  const chapters = course.chapters.filter((chapter) => chapter.id !== chapterId);
  return chapters.length === course.chapters.length ? course : withChapters(course, chapters);
}

export function updateChapter(
  course: Course,
  chapterId: string,
  patch: Partial<Omit<Chapter, 'id' | 'blocks'>>,
): Course {
  return mapChapter(course, chapterId, (chapter) => ({ ...chapter, ...patch }));
}

export function moveChapter(course: Course, from: number, to: number): Course {
  if (from === to || from < 0 || from >= course.chapters.length) return course;
  return withChapters(course, moveItem(course.chapters, from, to));
}

export function duplicateChapterById(course: Course, chapterId: string): Course {
  const index = chapterIndexOf(course, chapterId);
  if (index === -1) return course;
  return addChapter(course, duplicateChapter(course.chapters[index]), index + 1);
}

// ─────────────────────────── בלוקים ───────────────────────────

export function addBlock(course: Course, chapterId: string, block: Block, atIndex?: number): Course {
  return mapChapter(course, chapterId, (chapter) => {
    const index = atIndex === undefined ? chapter.blocks.length : clamp(atIndex, 0, chapter.blocks.length);
    const blocks = [...chapter.blocks];
    blocks.splice(index, 0, block);
    return { ...chapter, blocks };
  });
}

export function removeBlock(course: Course, blockId: string): Course {
  const location = findBlock(course, blockId);
  if (!location) return course;
  return mapChapter(course, location.chapter.id, (chapter) => ({
    ...chapter,
    blocks: chapter.blocks.filter((block) => block.id !== blockId),
  }));
}

export function updateBlockContent(course: Course, blockId: string, content: BlockContent): Course {
  const location = findBlock(course, blockId);
  if (!location) return course;
  return mapChapter(course, location.chapter.id, (chapter) => ({
    ...chapter,
    blocks: chapter.blocks.map((block) => (block.id === blockId ? { ...block, content } : block)),
  }));
}

export function updateBlockSettings(
  course: Course,
  blockId: string,
  patch: Partial<BlockSettings>,
): Course {
  const location = findBlock(course, blockId);
  if (!location) return course;
  return mapChapter(course, location.chapter.id, (chapter) => ({
    ...chapter,
    blocks: chapter.blocks.map((block) =>
      block.id === blockId ? { ...block, settings: { ...block.settings, ...patch } } : block,
    ),
  }));
}

export function duplicateBlockById(course: Course, blockId: string): { course: Course; newBlockId?: string } {
  const location = findBlock(course, blockId);
  if (!location) return { course };

  const copy = duplicateBlock(location.block);
  return {
    course: addBlock(course, location.chapter.id, copy, location.blockIndex + 1),
    newBlockId: copy.id,
  };
}

export function moveBlockWithinChapter(
  course: Course,
  chapterId: string,
  from: number,
  to: number,
): Course {
  if (from === to) return course;
  return mapChapter(course, chapterId, (chapter) => {
    if (from < 0 || from >= chapter.blocks.length) return chapter;
    return { ...chapter, blocks: moveItem(chapter.blocks, from, to) };
  });
}

/**
 * העברת בלוק בין פרקים.
 *
 * מבוצעת כהסרה והוספה בפעולה אחת ולא כשתי פעולות נפרדות, כדי שלא ייווצר
 * מצב ביניים שבו הבלוק קיים בשני פרקים או בלא אחד — מצב שהיה נרשם
 * כשתי רשומות undo וגם היה מבלבל את הבחירה בקנבס.
 */
export function moveBlockToChapter(
  course: Course,
  blockId: string,
  targetChapterId: string,
  targetIndex: number,
): Course {
  const location = findBlock(course, blockId);
  if (!location) return course;

  if (location.chapter.id === targetChapterId) {
    const adjusted = targetIndex > location.blockIndex ? targetIndex - 1 : targetIndex;
    return moveBlockWithinChapter(course, targetChapterId, location.blockIndex, adjusted);
  }

  if (chapterIndexOf(course, targetChapterId) === -1) return course;

  const chapters = course.chapters.map((chapter) => {
    if (chapter.id === location.chapter.id) {
      return { ...chapter, blocks: chapter.blocks.filter((block) => block.id !== blockId) };
    }
    if (chapter.id === targetChapterId) {
      const blocks = [...chapter.blocks];
      blocks.splice(clamp(targetIndex, 0, blocks.length), 0, location.block);
      return { ...chapter, blocks };
    }
    return chapter;
  });

  return withChapters(course, chapters);
}

/** הזזה בצעד אחד למעלה או למטה, כולל מעבר לפרק הסמוך בקצוות */
export function nudgeBlock(course: Course, blockId: string, direction: -1 | 1): Course {
  const location = findBlock(course, blockId);
  if (!location) return course;

  const target = location.blockIndex + direction;

  if (target >= 0 && target < location.chapter.blocks.length) {
    return moveBlockWithinChapter(course, location.chapter.id, location.blockIndex, target);
  }

  const neighbourIndex = location.chapterIndex + direction;
  const neighbour = course.chapters[neighbourIndex];
  if (!neighbour) return course;

  return moveBlockToChapter(
    course,
    blockId,
    neighbour.id,
    direction === -1 ? neighbour.blocks.length : 0,
  );
}

// ─────────────────────────── לומדה ───────────────────────────

export function updateCourse(
  course: Course,
  patch: Partial<Omit<Course, 'id' | 'chapters'>>,
): Course {
  return { ...course, ...patch };
}
