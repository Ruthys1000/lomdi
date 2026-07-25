import type { Course } from '@/model/types';

/**
 * שיטוח מבנה הלומדה לרשימה אנכית אחת, לצורך גרירה.
 *
 * זו ההחלטה המרכזית בגרירה: במקום שכל פרק יהיה מיכל נפרד — מה שמחייב
 * multi-container sorting, החלק השביר ביותר ב-dnd-kit ובמיוחד ב-RTL —
 * כל הפרקים והבלוקים הופכים לרשימה שטוחה אחת של פריטים ניתנים לגרירה.
 * העברת בלוק בין פרקים היא אז פשוט הזזה בתוך רשימה, ו-resolveDrop מתרגם
 * את המיקום החדש חזרה לפעולה על המודל.
 */

export type OutlineItem =
  | { kind: 'chapter'; id: string; chapterId: string; chapterIndex: number }
  | { kind: 'block'; id: string; chapterId: string; chapterIndex: number; blockIndex: number };

export function flattenOutline(course: Course, collapsedChapterIds: string[]): OutlineItem[] {
  const items: OutlineItem[] = [];

  course.chapters.forEach((chapter, chapterIndex) => {
    items.push({ kind: 'chapter', id: chapter.id, chapterId: chapter.id, chapterIndex });

    if (collapsedChapterIds.includes(chapter.id)) return;

    chapter.blocks.forEach((block, blockIndex) => {
      items.push({
        kind: 'block',
        id: block.id,
        chapterId: chapter.id,
        chapterIndex,
        blockIndex,
      });
    });
  });

  return items;
}

export type DropResult =
  | { type: 'moveChapter'; from: number; to: number }
  | { type: 'moveBlock'; blockId: string; targetChapterId: string; targetIndex: number }
  | { type: 'none' };

/**
 * מתרגם גרירה ברשימה השטוחה לפעולה על המודל.
 *
 * פרק נגרר תמיד אל מיקום של פרק אחר — גרירת פרק אל תוך בלוק אינה פעולה
 * בעלת משמעות, ולכן מתעלמים ממנה במקום לנחש כוונה.
 */
export function resolveDrop(items: OutlineItem[], activeId: string, overId: string): DropResult {
  const active = items.find((item) => item.id === activeId);
  const over = items.find((item) => item.id === overId);
  if (!active || !over || activeId === overId) return { type: 'none' };

  if (active.kind === 'chapter') {
    if (over.kind !== 'chapter') return { type: 'none' };
    return { type: 'moveChapter', from: active.chapterIndex, to: over.chapterIndex };
  }

  // שחרור בלוק על כותרת פרק = הכנסה בראש אותו פרק
  if (over.kind === 'chapter') {
    return {
      type: 'moveBlock',
      blockId: active.id,
      targetChapterId: over.chapterId,
      targetIndex: 0,
    };
  }

  // שחרור על בלוק אחר: נכנס במקומו. בתוך אותו פרק, גרירה כלפי מטה
  // דורשת אינדקס אחד גבוה יותר, כי הבלוק הנגרר מוסר לפני ההכנסה.
  const movingDownInSameChapter =
    active.chapterId === over.chapterId && active.blockIndex < over.blockIndex;

  return {
    type: 'moveBlock',
    blockId: active.id,
    targetChapterId: over.chapterId,
    targetIndex: movingDownInSameChapter ? over.blockIndex + 1 : over.blockIndex,
  };
}
