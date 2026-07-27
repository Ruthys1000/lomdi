import { useRef, type RefObject } from 'react';
import type { Chapter } from '@/model/types';
import { useReadingProgress } from './scrollEffects';

interface ScrollNavigationProps {
  chapters: Chapter[];
  renderChapter: (chapter: Chapter, index: number) => React.ReactNode;
  /** פס התקדמות קריאה בראש הלומדה */
  showProgress: boolean;
  /** שורש הלומדה — ממנו מאותר מיכל הגלילה (window בתוצר, div בתצוגה מקדימה) */
  rootRef: RefObject<HTMLElement | null>;
}

/**
 * מצב גלילה רציפה: כל הפרקים בזה אחר זה בעמוד אחד.
 *
 * בניגוד למצב הפרקים אין כאן סרגלי ניווט — הפרקים משמשים כעוגנים סמנטיים,
 * וכותרות הפרקים (שמתווספות ב-CourseRenderer) נותנות את המבנה החזותי. פס
 * התקדמות דק ודביק בראש העמוד מראה כמה מהלומדה כבר נקרא.
 */
export function ScrollNavigation({
  chapters,
  renderChapter,
  showProgress,
  rootRef,
}: ScrollNavigationProps) {
  const barRef = useRef<HTMLDivElement>(null);
  useReadingProgress(rootRef, barRef, showProgress);

  return (
    <>
      {showProgress && (
        <div className="lc-reading-progress" aria-hidden>
          <div ref={barRef} className="lc-reading-progress__bar" />
        </div>
      )}

      <main className="lc-scroll-mode" id="lc-main" tabIndex={-1}>
        {chapters.map((chapter, index) => renderChapter(chapter, index))}
      </main>
    </>
  );
}
