import type { Chapter } from '@/model/types';

interface ScrollNavigationProps {
  chapters: Chapter[];
  renderChapter: (chapter: Chapter, index: number) => React.ReactNode;
}

/**
 * מצב גלילה רציפה: כל הפרקים בזה אחר זה בעמוד אחד.
 *
 * אין כאן סרגלי ניווט — הפרקים משמשים כעוגנים סמנטיים בלבד, וכך הלומדה
 * מתנהגת כמו דף תוכן מודרני ולא כמו מצגת.
 */
export function ScrollNavigation({ chapters, renderChapter }: ScrollNavigationProps) {
  return (
    <main className="lc-scroll-mode" id="lc-main" tabIndex={-1}>
      {chapters.map((chapter, index) => renderChapter(chapter, index))}
    </main>
  );
}
