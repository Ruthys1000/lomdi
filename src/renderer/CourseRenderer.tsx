import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Block, Chapter, Course } from '@/model/types';
import { BlockRenderer } from './BlockRenderer';
import { ChapterNavigation } from './ChapterNavigation';
import { RenderContext, type RenderContextValue } from './RenderContext';
import { ScrollNavigation } from './ScrollNavigation';
import { themeToCssVarMap } from './theme/themeToCssVars';
import './styles/course.css';

/**
 * עוטף בלוק בקנבס העריכה. מוגדר כאן ומיושם בעורך, כדי שהרנדרר לא יצטרך
 * להכיר את מצב העריכה — ובתוצר הוא פשוט אינו נמסר.
 */
export type BlockWrapper = (block: Block, rendered: ReactNode) => ReactNode;

export interface CourseRendererProps {
  course: Course;
  resolveAssetUrl: (assetId: string) => string | undefined;
  /** true כשהרנדרר מוצג בתוך קנבס העריכה ולא בתצוגה מקדימה או בתוצר */
  isEditing?: boolean;
  /** בעורך: הפרק שנערך כרגע גובר על הניווט הפנימי של הלומדה */
  forcedChapterIndex?: number;
  renderBlockWrapper?: BlockWrapper;
}

/**
 * שורש הלומדה — הרכיב היחיד שגם קנבס העריכה, גם התצוגה המקדימה וגם
 * הלומדה המיוצאת מרנדרים. זו הסיבה שאין ולא יכול להיות פער בין מה
 * שהעורך מציג לבין התוצר (סעיף 15 באפיון).
 *
 * העורך מזריק דרך renderBlockWrapper את המסגרת וסרגל הפעולות של הבלוק,
 * במקום שהרנדרר יכיר את מצב העריכה. כך קוד העורך נשאר מחוץ לחבילת
 * ה-runtime, וה-wrapper פשוט אינו קיים בתוצר.
 */
export function CourseRenderer({
  course,
  resolveAssetUrl,
  isEditing = false,
  forcedChapterIndex,
  renderBlockWrapper,
}: CourseRendererProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const ctx: RenderContextValue = useMemo(
    () => ({ direction: course.direction, resolveAssetUrl, isEditing }),
    [course.direction, resolveAssetUrl, isEditing],
  );

  const themeStyle = useMemo(
    () => themeToCssVarMap(course.theme) as React.CSSProperties,
    [course.theme],
  );

  // מחיקת הפרק הפעיל לא צריכה להשאיר מסך ריק
  useEffect(() => {
    if (activeIndex >= course.chapters.length) {
      setActiveIndex(Math.max(0, course.chapters.length - 1));
    }
  }, [activeIndex, course.chapters.length]);

  const renderChapter = (chapter: Chapter, index: number) => (
    <section
      key={chapter.id}
      className="lc-chapter"
      aria-label={chapter.title}
      data-chapter-id={chapter.id}
      data-chapter-index={index}
    >
      {chapter.blocks.map((block) => {
        const rendered = <BlockRenderer block={block} isEditing={isEditing} />;
        return (
          <div key={block.id} className="lc-block-slot" data-block-id={block.id}>
            {renderBlockWrapper ? renderBlockWrapper(block, rendered) : rendered}
          </div>
        );
      })}

      {chapter.blocks.length === 0 && isEditing && (
        <p className="lc-empty-chapter">הפרק ריק. הוסיפו בלוק כדי להתחיל.</p>
      )}
    </section>
  );

  const chapterIndex = forcedChapterIndex ?? activeIndex;
  const useChapterMode = course.navigation.mode === 'chapters' && forcedChapterIndex === undefined;

  return (
    <RenderContext value={ctx}>
      {/*
        בחירות עיצוב שאינן ניתנות לביטוי כערך יחיד של משתנה CSS — סגנון
        כותרות, כפתורים וכרטיסים — עוברות כמאפייני data ונתפסות ב-course.css
        בבורר אחד לכל אחת, במקום לשכפל קלאסים בכל בלוק בנפרד.
      */}
      <div
        className="lc-course"
        dir={course.direction}
        lang={course.language}
        style={themeStyle}
        data-navigation={course.navigation.mode}
        data-heading-style={course.theme.typography.headingStyle}
        data-button-style={course.theme.shape.buttonStyle}
        data-card-style={course.theme.shape.cardStyle}
      >
        {/*
          קישור דילוג לתוכן — פריט נגישות בסיסי (WCAG 2.4.1). מוסתר עד שהוא
          מקבל פוקוס, ואז מאפשר לדלג ישירות אל <main id="lc-main"> בלי לעבור
          את סרגלי הניווט. אינו מוצג בקנבס העריכה.
        */}
        {!isEditing && (
          <a href="#lc-main" className="lc-skip-link">
            דלג לתוכן
          </a>
        )}

        {useChapterMode ? (
          <ChapterNavigation
            chapters={course.chapters}
            navigation={course.navigation}
            activeIndex={Math.min(activeIndex, Math.max(0, course.chapters.length - 1))}
            onNavigate={setActiveIndex}
            renderChapter={renderChapter}
          />
        ) : forcedChapterIndex === undefined ? (
          <ScrollNavigation chapters={course.chapters} renderChapter={renderChapter} />
        ) : (
          <main className="lc-scroll-mode">
            {course.chapters[chapterIndex]
              ? renderChapter(course.chapters[chapterIndex], chapterIndex)
              : null}
          </main>
        )}
      </div>
    </RenderContext>
  );
}
