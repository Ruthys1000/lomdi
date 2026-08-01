import { createHeroContent } from '@/blocks/hero/content';
import { createBlock } from '@/model/factory';
import type { Block, BlockContent, Chapter, Course } from '@/model/types';

/**
 * "טעם עריכה" — נורמליזציות שהופכות פלט תקין ללומדה שנראית ערוכה.
 *
 * מודל שפה תמים נוטה לשפוך פסקאות טקסט בזו אחר זו: תקין, אבל שטוח. הפונקציה
 * כאן מוסיפה את מה שעורך אנושי היה מוסיף אוטומטית — מסך פתיחה בראש הלומדה
 * וקצב חזותי בין רצפי טקסט ארוכים — דרך אותם יוצרים של המודל, בלי להמציא
 * מבנה נתונים חדש. היא רצה *אחרי* `coerceGeneratedCourse`, על קלט שכבר תקין.
 */

export interface RefineResult {
  course: Course;
  warnings: string[];
}

/** רצף כזה של פסקאות ברצף מזמין מפריד שיתן לעין נקודת עצירה */
const RICH_TEXT_RUN_BEFORE_DIVIDER = 3;

function ensureOpeningHero(chapter: Chapter, course: Course): boolean {
  if (chapter.blocks[0]?.type === 'hero') return false;

  const hero = createBlock('hero', {
    content: createHeroContent({
      title: course.title || 'לומדה חדשה',
      subtitle: course.subtitle || '',
    }) as unknown as BlockContent,
  });

  chapter.blocks.unshift(hero);
  return true;
}

/** משבץ מפריד אחרי כל רצף ארוך של בלוקי טקסט, לקצב חזותי */
function paceChapter(chapter: Chapter): boolean {
  const paced: Block[] = [];
  let run = 0;
  let added = false;

  chapter.blocks.forEach((block, index) => {
    paced.push(block);
    run = block.type === 'richText' ? run + 1 : 0;

    const isLast = index === chapter.blocks.length - 1;
    if (run >= RICH_TEXT_RUN_BEFORE_DIVIDER && !isLast) {
      paced.push(createBlock('divider'));
      run = 0;
      added = true;
    }
  });

  chapter.blocks = paced;
  return added;
}

export function refineCourse(course: Course): RefineResult {
  const next = structuredClone(course);
  const warnings: string[] = [];

  if (next.chapters.length > 0 && ensureOpeningHero(next.chapters[0], next)) {
    warnings.push('נוסף מסך פתיחה בראש הלומדה.');
  }

  let pacedAny = false;
  for (const chapter of next.chapters) {
    if (paceChapter(chapter)) pacedAny = true;
  }
  if (pacedAny) warnings.push('נוספו מפרידים בין רצפי טקסט ארוכים.');

  return { course: next, warnings };
}
