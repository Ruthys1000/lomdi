import { useEffect, useId, useRef, useState } from 'react';
import type { Chapter, NavigationSettings } from '@/model/types';
import { courseIcons, navIcons } from './icons';
import { useRenderContext } from './RenderContext';

interface ChapterNavigationProps {
  chapters: Chapter[];
  navigation: NavigationSettings;
  activeIndex: number;
  onNavigate: (index: number) => void;
  renderChapter: (chapter: Chapter, index: number) => React.ReactNode;
  /**
   * כשמסופק, הכפתור בפרק האחרון הופך ל"סיום" ומסמן את הלומדה כהושלמה
   * (מעקב התקדמות פעיל). בלעדיו הכפתור מושבת בפרק האחרון כברירת המחדל.
   */
  onFinish?: () => void;
}

/**
 * מצב פרקים: פרק אחד במסך, עם הבא/הקודם, פס התקדמות ותפריט פרקים.
 *
 * סדר הכפתורים ב-DOM הוא [הקודם, הבא], וכיוון ה-flex מסתדר לבד לפי dir —
 * כך שבעברית "הבא" יופיע משמאל בלי קוד מיוחד. החצים מתחלפים לפי הכיוון,
 * כי חץ שמצביע לכיוון הלא נכון הוא אחת התקלות הנפוצות ב-RTL.
 */
export function ChapterNavigation({
  chapters,
  navigation,
  activeIndex,
  onNavigate,
  renderChapter,
  onFinish,
}: ChapterNavigationProps) {
  const { direction } = useRenderContext();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLElement>(null);
  // המעבר הראשון הוא הרינדור הראשוני; אין להזיז את הפוקוס אז — זה היה חוטף
  // את הפוקוס מיד עם טעינת הלומדה
  const isFirstRender = useRef(true);

  const isRtl = direction === 'rtl';
  const NextIcon = isRtl ? navIcons.ArrowLeft : navIcons.ArrowRight;
  const PrevIcon = isRtl ? navIcons.ArrowRight : navIcons.ArrowLeft;

  const total = chapters.length;
  const chapter = chapters[activeIndex];
  const progress = total > 0 ? ((activeIndex + 1) / total) * 100 : 0;

  const goTo = (index: number) => {
    if (index < 0 || index >= total) return;
    onNavigate(index);
    setMenuOpen(false);
  };

  // גלילה לראש הפרק בכל מעבר, והעברת פוקוס לגוף הפרק כדי שמשתמש מקלדת
  // וקורא-מסך יֵדעו שהתוכן התחלף — בלי זה הפוקוס נשאר על הכפתור הישן
  useEffect(() => {
    document.getElementById('lc-chapter-top')?.scrollIntoView?.({ block: 'start' });
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    bodyRef.current?.focus();
  }, [activeIndex]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    // סגירת התפריט בלחיצה מחוץ לו — התנהגות צפויה מכל תפריט נפתח
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [isMenuOpen]);

  // ניווט בחצים בין פרקים. משתמשים בחצים אופקיים בלבד — הם אינם מתנגשים
  // עם גלילה אנכית של פרק ארוך — ומדלגים כשהפוקוס בתוך שדה קלט או אלמנט
  // אינטראקטיבי, כדי לא לחטוף חצים ששייכים לו
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      const forward = isRtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
      const next = forward ? activeIndex + 1 : activeIndex - 1;
      if (next < 0 || next >= total) return;
      event.preventDefault();
      goTo(next);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, total, isRtl]);

  if (!chapter) return null;

  return (
    <div className="lc-chapters-mode">
      <header className="lc-chapter-bar">
        <div className="lc-container lc-chapter-bar__inner">
          {navigation.showChapterNumber && (
            <p className="lc-chapter-bar__counter">
              {navigation.labels.chapter} {activeIndex + 1} מתוך {total}
            </p>
          )}

          {navigation.showChapterMenu && total > 1 && (
            <div className="lc-chapter-menu" ref={menuRef}>
              <button
                type="button"
                className="lc-button lc-button--ghost"
                aria-expanded={isMenuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <navIcons.ChevronDown className="lc-icon" aria-hidden />
                {navigation.labels.menu}
              </button>

              {isMenuOpen && (
                <ul id={menuId} className="lc-chapter-menu__list">
                  {chapters.map((item, index) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="lc-chapter-menu__item"
                        aria-current={index === activeIndex ? 'step' : undefined}
                        onClick={() => goTo(index)}
                      >
                        <span className="lc-chapter-menu__number">{index + 1}</span>
                        <span>{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {navigation.showProgress && (
          <div
            className="lc-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={activeIndex + 1}
            aria-label={`התקדמות: ${navigation.labels.chapter} ${activeIndex + 1} מתוך ${total}`}
          >
            <div className="lc-progress__bar" style={{ inlineSize: `${progress}%` }} />
          </div>
        )}
      </header>

      <span id="lc-chapter-top" />

      {/*
        tabIndex=-1 + focus במעבר: גוף הפרק מקבל פוקוס תכנותי בכל מעבר, כדי
        שקורא-מסך יקריא את שם הפרק החדש. aria-label מתעדכן עם הפרק כך שההקראה
        משמעותית.
      */}
      <main
        ref={bodyRef}
        className="lc-chapter-body"
        id="lc-main"
        tabIndex={-1}
        aria-label={`${navigation.labels.chapter} ${activeIndex + 1}: ${chapter.title}`}
      >
        {renderChapter(chapter, activeIndex)}
      </main>

      <nav className="lc-chapter-nav" aria-label="ניווט בין פרקים">
        <div className="lc-container lc-chapter-nav__inner">
          <button
            type="button"
            className="lc-button lc-button--ghost"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            <PrevIcon className="lc-icon" aria-hidden />
            {navigation.labels.prev}
          </button>

          {activeIndex >= total - 1 && onFinish ? (
            <button type="button" className="lc-button lc-button--primary" onClick={onFinish}>
              סיום
              <courseIcons.CircleCheck className="lc-icon" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              className="lc-button lc-button--primary"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex >= total - 1}
            >
              {navigation.labels.next}
              <NextIcon className="lc-icon" aria-hidden />
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
