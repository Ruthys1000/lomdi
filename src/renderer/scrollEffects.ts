import { useEffect, type RefObject } from 'react';

/**
 * אפקטי גלילה של הלומדה — חשיפה הדרגתית ופס התקדמות קריאה.
 *
 * הכל נייטיבי בלבד (React + APIs של הדפדפן), בלי תלות חיצונית, כדי שהקוד
 * ייכנס לחבילת ה-runtime המיוצאת בלי להפר את גבול הרנדרר ובלי לגרור משקל.
 *
 * שלושה כללים שנשמרים כאן במפורש:
 *
 * 1. **ברירת המחדל היא תוכן גלוי.** אם אין `IntersectionObserver` (למשל
 *    jsdom בבדיקות, או דפדפן עתיק) — הפונקציות יוצאות בשקט ולא נוגעות
 *    ב-DOM. ההסתרה ההתחלתית של החשיפה מופעלת רק אחרי שה-JS הוסיף את
 *    המחלקה `lc-animate-ready`, כך שבלי JS דבר אינו נעלם.
 *
 * 2. **מיכל הגלילה משתנה בין הסביבות.** בתוצר הגלילה היא ב-`window`,
 *    ובתצוגה המקדימה היא בתוך `div` פנימי. `findScrollParent` מאתר את
 *    המיכל הנכון במקום להניח אחד מהם.
 *
 * 3. **כיבוד `prefers-reduced-motion`.** משתמש שביקש פחות תנועה מקבל את
 *    התוכן מיד, בלי חשיפה הדרגתית ובלי `lc-animate-ready`.
 */

/** האם המשתמש ביקש לצמצם תנועה. מוגן מפני היעדר matchMedia (jsdom). */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * מאתר את אב הגלילה הראשון מעל אלמנט נתון.
 *
 * מטפס כלפי מעלה ומחזיר את ההורה הראשון שגליל בציר האנכי; אם אין כזה —
 * מחזיר את `window`, שהוא מיכל הגלילה של התוצר המיוצא.
 */
export function findScrollParent(element: HTMLElement | null): HTMLElement | Window {
  let node = element?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
}

/** מדדי הגלילה של מיכל — אחיד ל-window ולאלמנט */
function scrollMetrics(container: HTMLElement | Window) {
  if (container instanceof Window) {
    const doc = document.documentElement;
    return {
      scrollTop: window.scrollY,
      scrollHeight: doc.scrollHeight,
      clientHeight: window.innerHeight,
    };
  }
  return {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
  };
}

/**
 * חשיפה הדרגתית: בלוקים שנכנסים למסך מקבלים `lc-reveal--in`.
 *
 * `enabled` מכובה בקנבס העריכה — שם התוכן חייב להיות גלוי תמיד. הבלוקים
 * מסומנים מראש ב-`lc-reveal` ברנדרר; כאן רק מתווסף המצב שחושף אותם.
 */
export function useScrollReveal(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  /** משתנה בכל שינוי תוכן, כדי לצפות בבלוקים חדשים בתצוגה מקדימה חיה */
  revealKey?: unknown,
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return;

    // רק מכאן ההסתרה ההתחלתית נכנסת לתוקף (ראה כלל 1)
    root.classList.add('lc-animate-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('lc-reveal--in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );

    const targets = [...root.querySelectorAll('.lc-reveal:not(.lc-reveal--in)')];

    // תוכן שכבר גלוי בטעינה לא יסתמך על מסירת ה-IntersectionObserver (שהיא
    // אסינכרונית ולעיתים איטית) — אחרת המסך הראשון עלול להישאר ריק. הוא
    // נחשף בכוחות עצמו בפריים הבא (עם fade רך), ורק תוכן שמתחת לקיפול נצפה.
    const viewportHeight = () => window.innerHeight || document.documentElement.clientHeight;
    const isInView = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < viewportHeight();
    };

    const revealInitial = () => {
      for (const target of targets) {
        if (isInView(target)) target.classList.add('lc-reveal--in');
        else observer.observe(target);
      }
    };

    // double-rAF: מצב ההסתרה מספיק להיצבע פעם אחת לפני החשיפה, כדי שה-fade
    // ייראה. אם אין rAF (לא אמור לקרות כשיש IntersectionObserver) — חושפים מיד.
    let raf1 = 0;
    let raf2 = 0;
    if (typeof requestAnimationFrame === 'function') {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(revealInitial);
      });
    } else {
      revealInitial();
    }

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      observer.disconnect();
    };
    // rootRef יציב; enabled וזהות התוכן (revealKey) מריצים מחדש
  }, [rootRef, enabled, revealKey]);
}

/**
 * פס התקדמות קריאה: מעדכן `--lc-progress` על אלמנט ה-bar לפי מיקום הגלילה.
 *
 * הת'רוטלינג הוא `requestAnimationFrame` ולא ספריית עזר, כדי לא לגרור
 * תלות לחבילת הלומדה. מוגן מפני חלוקה באפס וסביבות בלי גלילה (jsdom).
 */
export function useReadingProgress(
  rootRef: RefObject<HTMLElement | null>,
  barRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!enabled || !root || !bar) return;
    if (typeof requestAnimationFrame === 'undefined') return;

    const container = findScrollParent(root);
    let frame = 0;

    const update = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = scrollMetrics(container);
      const scrollable = scrollHeight - clientHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
      bar.style.setProperty('--lc-progress', `${(ratio * 100).toFixed(2)}%`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    const target: HTMLElement | Window = container;
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [rootRef, barRef, enabled]);
}
