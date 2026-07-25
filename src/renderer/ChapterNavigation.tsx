import { useEffect, useId, useState } from 'react';
import type { Chapter, NavigationSettings } from '@/model/types';
import { navIcons } from './icons';
import { useRenderContext } from './RenderContext';

interface ChapterNavigationProps {
  chapters: Chapter[];
  navigation: NavigationSettings;
  activeIndex: number;
  onNavigate: (index: number) => void;
  renderChapter: (chapter: Chapter, index: number) => React.ReactNode;
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
}: ChapterNavigationProps) {
  const { direction } = useRenderContext();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

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

  // גלילה לראש הפרק בכל מעבר — בלעדיה הלומד נוחת באמצע הפרק הבא
  useEffect(() => {
    document.getElementById('lc-chapter-top')?.scrollIntoView({ block: 'start' });
  }, [activeIndex]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

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
            <div className="lc-chapter-menu">
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

      <main className="lc-chapter-body">{renderChapter(chapter, activeIndex)}</main>

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

          <button
            type="button"
            className="lc-button lc-button--primary"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex >= total - 1}
          >
            {navigation.labels.next}
            <NextIcon className="lc-icon" aria-hidden />
          </button>
        </div>
      </nav>
    </div>
  );
}
