import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { Chapter } from '@/model/types';
import { useReadingProgress } from './scrollEffects';

interface ScrollNavigationProps {
  chapters: Chapter[];
  renderChapter: (chapter: Chapter, index: number) => React.ReactNode;
  /** פס התקדמות קריאה בראש הלומדה */
  showProgress: boolean;
  /** שורש הלומדה — ממנו מאותר מיכל הגלילה (window בתוצר, div בתצוגה מקדימה) */
  rootRef: RefObject<HTMLElement | null>;
  /** רצועת הסיום שמתווספת בתחתית (מעקב התקדמות פעיל) */
  completion?: ReactNode;
  /** נקרא פעם אחת כשרצועת הסיום נכנסת לתצוגה — מסמן את הלומדה כהושלמה */
  onReachedEnd?: () => void;
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
  completion,
  onReachedEnd,
}: ScrollNavigationProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useReadingProgress(rootRef, barRef, showProgress);

  // סימון "הושלם" כשרצועת הסיום נכנסת לתצוגה — במצב גלילה אין כפתור "סיום".
  // בלי IntersectionObserver (jsdom, דפדפן ישן) מדלגים על הסימון האוטומטי —
  // הרצועה עדיין מוצגת, בדיוק כמו ברירת המחדל של החשיפה ההדרגתית.
  useEffect(() => {
    const target = endRef.current;
    if (!completion || !onReachedEnd || !target || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onReachedEnd();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [completion, onReachedEnd]);

  return (
    <>
      {showProgress && (
        <div className="lc-reading-progress" aria-hidden>
          <div ref={barRef} className="lc-reading-progress__bar" />
        </div>
      )}

      <main className="lc-scroll-mode" id="lc-main" tabIndex={-1}>
        {chapters.map((chapter, index) => renderChapter(chapter, index))}
        {completion && <div ref={endRef}>{completion}</div>}
      </main>
    </>
  );
}
