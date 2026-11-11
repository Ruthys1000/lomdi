import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Block, Chapter, Course } from '@/model/types';
import { BlockRenderer } from './BlockRenderer';
import { ChapterNavigation, type ChapterStatus } from './ChapterNavigation';
import { CompletionSummary, type ChapterScore } from './CompletionSummary';
import { ProgressContext } from './progress/ProgressContext';
import { useCourseProgress } from './progress/useCourseProgress';
import { RenderContext, type RenderContextValue } from './RenderContext';
import { ResumeBanner } from './ResumeBanner';
import { ScrollNavigation } from './ScrollNavigation';
import { useScrollReveal } from './scrollEffects';
import { isDarkSurface, themeToCssVarMap } from './theme/themeToCssVars';
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
  /**
   * true בסביבות היוצר (עורך + תצוגה מקדימה), false בתוצר. שולט בהצגת רמזי
   * יצירה — placeholder לתמונה עם פרומפט מומלץ — שהלומד לא אמור לראות.
   */
  authoring?: boolean;
  /** בעורך: הפרק שנערך כרגע גובר על הניווט הפנימי של הלומדה */
  forcedChapterIndex?: number;
  renderBlockWrapper?: BlockWrapper;
  /**
   * בעורך: מצב ריק אינטראקטיבי לפרק בלי בלוקים. מוזרק מבחוץ כמו
   * renderBlockWrapper, כדי שהרנדרר לא יכיר את ספריית הבלוקים של העורך. בתצוגה
   * ובתוצר לא נמסר — שם פרק ריק פשוט אינו מציג דבר.
   */
  renderEmptyChapter?: (chapterId: string) => ReactNode;
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
  authoring = false,
  forcedChapterIndex,
  renderBlockWrapper,
  renderEmptyChapter,
}: CourseRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // מעקב התקדמות פעיל רק בתוצר ובתצוגה המקדימה (לא בקנבס העריכה) וכשהמחבר
  // השאיר אותו דלוק. בעורך הוא כבוי, ולכן חידוש המיקום ומסך הסיום אינם
  // מפריעים לעריכה.
  const trackingEnabled = !isEditing && course.navigation.trackProgress;
  const totalQuizzes = useMemo(
    () =>
      course.chapters.reduce(
        (sum, chapter) => sum + chapter.blocks.filter((block) => block.type === 'quiz').length,
        0,
      ),
    [course.chapters],
  );
  const chapterIds = useMemo(() => course.chapters.map((chapter) => chapter.id), [course.chapters]);
  const progress = useCourseProgress(course.id, {
    enabled: trackingEnabled,
    totalQuizzes,
    chapterIds,
    passScore: course.navigation.passScore,
  });
  const activeIndex = progress.chapterIndex;
  const setActiveIndex = progress.setChapterIndex;

  // חשיפה הדרגתית פעילה רק בתוצר ובתצוגה המקדימה — בקנבס העריכה התוכן
  // חייב להיות גלוי תמיד. revealKey מריץ מחדש כשמבנה התוכן משתנה.
  //
  // במצב פרקים מרונדר רק הפרק הפעיל, ובלוקיו מתמונטים מחדש בכל מעבר. לכן
  // המפתח חייב לכלול את אינדקס הפרק הפעיל — אחרת ה-IntersectionObserver
  // של החשיפה נבנה פעם אחת על פרק 1 בלבד, ובלוקי פרק 2+ נשארים מוסתרים
  // (opacity:0) ומציגים גוף ריק. במצב גלילה activeIndex נשאר 0, ולכן
  // המפתח יציב ואין רינדור-יתר.
  const revealKey = useMemo(() => {
    const structure = course.chapters
      .map((chapter) => `${chapter.id}:${chapter.blocks.length}`)
      .join('|');
    const inChapterMode = course.navigation.mode === 'chapters' && forcedChapterIndex === undefined;
    return inChapterMode ? `${structure}::ch${activeIndex}` : structure;
  }, [course.chapters, course.navigation.mode, forcedChapterIndex, activeIndex]);
  useScrollReveal(rootRef, !isEditing, revealKey);

  const ctx: RenderContextValue = useMemo(
    () => ({ direction: course.direction, resolveAssetUrl, isEditing, authoring }),
    [course.direction, resolveAssetUrl, isEditing, authoring],
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
  }, [activeIndex, course.chapters.length, setActiveIndex]);

  const nav = course.navigation;
  // המונה של מצב פרקים כבר בסרגל, ולכן ה-eyebrow "פרק N" בכותרת מיותר שם;
  // הוא מוצג במצב גלילה ובקנבס העריכה, ששם אין סרגל מונה
  const inChapterBarMode = nav.mode === 'chapters' && forcedChapterIndex === undefined;
  const showChapterEyebrow = nav.showChapterNumber && !inChapterBarMode;

  const renderChapter = (chapter: Chapter, index: number) => {
    // כשפרק פותח ב-hero, ה-hero הוא הפתיח החזותי שלו — כותרת פרק מעליו רק
    // מתחרה בו, ולכן מדלגים עליה ונותנים ל-hero להיות הכותרת
    const firstBlockIsHero = chapter.blocks[0]?.type === 'hero';
    const hasHeader =
      !firstBlockIsHero &&
      (Boolean(chapter.title) || Boolean(chapter.description) || showChapterEyebrow);

    return (
      <section
        key={chapter.id}
        className="lc-chapter"
        aria-label={chapter.title}
        data-chapter-id={chapter.id}
        data-chapter-index={index}
      >
        {hasHeader && (
          <header className="lc-chapter-header lc-container lc-reveal">
            {showChapterEyebrow && (
              <p className="lc-chapter-header__eyebrow">
                {nav.labels.chapter} {index + 1}
              </p>
            )}
            {chapter.title && <h2 className="lc-chapter-header__title">{chapter.title}</h2>}
            {chapter.description && (
              <p className="lc-chapter-header__desc">{chapter.description}</p>
            )}
          </header>
        )}

        {chapter.blocks.map((block) => {
          const rendered = <BlockRenderer block={block} isEditing={isEditing} />;
          return (
            <div key={block.id} className="lc-block-slot lc-reveal" data-block-id={block.id}>
              {renderBlockWrapper ? renderBlockWrapper(block, rendered) : rendered}
            </div>
          );
        })}

        {chapter.blocks.length === 0 && isEditing && (
          renderEmptyChapter ? (
            renderEmptyChapter(chapter.id)
          ) : (
            <p className="lc-empty-chapter">הפרק ריק. הוסיפו בלוק כדי להתחיל.</p>
          )
        )}
      </section>
    );
  };

  const chapterIndex = forcedChapterIndex ?? activeIndex;
  const useChapterMode = course.navigation.mode === 'chapters' && forcedChapterIndex === undefined;
  // מאגר מצב הבלוקים נמסר רק מחוץ לקנבס העריכה: שם בלוק אינטראקטיבי מחזיק
  // את המצב שלו מקומית, כדי שמשחק של המחבר עם שאלה לא יישמר כתשובת לומד.
  // בתצוגה המקדימה ובתוצר המאגר פעיל גם כשהמעקב כבוי — אז הוא זיכרון זמני
  // שמחזיק את התשובות בין פרקים, בלי לגעת באחסון.
  const progressValue = useMemo(
    () =>
      isEditing
        ? { reportQuiz: progress.reportQuiz }
        : {
            reportQuiz: progress.reportQuiz,
            blockState: progress.blockState,
            setBlockState: progress.setBlockState,
          },
    [isEditing, progress.reportQuiz, progress.blockState, progress.setBlockState],
  );

  // במצב פרקים הסיום הוא מסך מלא שמחליף את סרגלי הניווט; במצב גלילה הוא
  // רצועה בתחתית והלומדה נשארת גלויה מעליה
  const showCompletionScreen = useChapterMode && trackingEnabled && progress.completed;

  // ── רצף למידה ──────────────────────────────────────────────────────
  // לכל פרק: אילו בלוקים דורשים מענה, וכמה משאלות הבחירה נענו נכון
  const chapterAnswers = useMemo(
    () =>
      course.chapters.map((chapter) => {
        const quizIds = chapter.blocks.filter((b) => b.type === 'quiz').map((b) => b.id);
        const challengeIds = chapter.blocks.filter((b) => b.type === 'challenge').map((b) => b.id);
        const answered =
          quizIds.every((id) => id in progress.quizResults) &&
          challengeIds.every((id) => isSubmitted(progress.blockState[id]));
        const correct = quizIds.filter((id) => progress.quizResults[id] === true).length;
        return { id: chapter.id, title: chapter.title, answered, correct, total: quizIds.length };
      }),
    [course.chapters, progress.quizResults, progress.blockState],
  );

  const chapterStatuses: ChapterStatus[] | undefined = useMemo(() => {
    if (!trackingEnabled) return undefined;
    const done = course.chapters.map((chapter) => progress.doneChapters.includes(chapter.id));
    // בסדר ליניארי פתוח רק הפרק הראשון שעוד לא הושלם, וכל מה שלפניו
    const firstOpen = done.indexOf(false);
    const frontier = firstOpen === -1 ? done.length : firstOpen;
    return done.map((isDone, index) =>
      isDone ? 'done' : nav.sequence === 'linear' && index > frontier ? 'locked' : 'open',
    );
  }, [trackingEnabled, course.chapters, progress.doneChapters, nav.sequence]);

  const canAdvance =
    !trackingEnabled ||
    !nav.requireAnswersToAdvance ||
    (chapterAnswers[activeIndex]?.answered ?? true);

  const chapterScores: ChapterScore[] = chapterAnswers;
  const firstMistakeIndex = chapterAnswers.findIndex((chapter) => chapter.correct < chapter.total);

  // הודעת "ממשיכים מאיפה שעצרת": עד שהלומד סוגר אותה או עובר פרק
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const resumeIndex = useRef(activeIndex);
  const showResume =
    trackingEnabled &&
    progress.resumed &&
    !resumeDismissed &&
    !progress.completed &&
    activeIndex === resumeIndex.current;
  const resumeChapter = course.chapters[activeIndex];
  const resumeLocation =
    useChapterMode && activeIndex > 0 && resumeChapter
      ? `${nav.labels.chapter} ${activeIndex + 1}${resumeChapter.title ? `: ${resumeChapter.title}` : ''}`
      : undefined;

  return (
    <RenderContext value={ctx}>
      <ProgressContext value={progressValue}>
      {/*
        בחירות עיצוב שאינן ניתנות לביטוי כערך יחיד של משתנה CSS — סגנון
        כותרות, כפתורים וכרטיסים — עוברות כמאפייני data ונתפסות ב-course.css
        בבורר אחד לכל אחת, במקום לשכפל קלאסים בכל בלוק בנפרד.
      */}
      <div
        ref={rootRef}
        className="lc-course"
        dir={course.direction}
        lang={course.language}
        style={themeStyle}
        data-navigation={course.navigation.mode}
        data-scheme={isDarkSurface(course.theme.colors.background) ? 'dark' : 'light'}
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

        {showResume && (
          <ResumeBanner
            location={resumeLocation}
            onRestart={progress.reset}
            onDismiss={() => setResumeDismissed(true)}
          />
        )}

        {showCompletionScreen ? (
          <main className="lc-chapter-body" id="lc-main" tabIndex={-1}>
            <CompletionSummary
              correctCount={progress.correctCount}
              totalQuizzes={totalQuizzes}
              passScore={nav.passScore}
              chapters={chapterScores}
              onReview={() => {
                progress.setCompleted(false);
                setActiveIndex(0);
              }}
              onReviewMistakes={
                firstMistakeIndex >= 0
                  ? () => {
                      progress.setCompleted(false);
                      setActiveIndex(firstMistakeIndex);
                    }
                  : undefined
              }
            />
          </main>
        ) : useChapterMode ? (
          <ChapterNavigation
            chapters={course.chapters}
            navigation={course.navigation}
            activeIndex={Math.min(activeIndex, Math.max(0, course.chapters.length - 1))}
            onNavigate={setActiveIndex}
            renderChapter={renderChapter}
            onFinish={trackingEnabled ? () => progress.setCompleted(true) : undefined}
            statuses={chapterStatuses}
            canAdvance={canAdvance}
          />
        ) : forcedChapterIndex === undefined ? (
          <ScrollNavigation
            chapters={course.chapters}
            renderChapter={renderChapter}
            showProgress={course.navigation.showProgress}
            rootRef={rootRef}
            completion={
              trackingEnabled ? (
                <CompletionSummary
                  correctCount={progress.correctCount}
                  totalQuizzes={totalQuizzes}
                  passScore={nav.passScore}
                  chapters={chapterScores}
                />
              ) : undefined
            }
            onReachedEnd={trackingEnabled ? () => progress.setCompleted(true) : undefined}
          />
        ) : (
          <main className="lc-scroll-mode">
            {course.chapters[chapterIndex]
              ? renderChapter(course.chapters[chapterIndex], chapterIndex)
              : null}
          </main>
        )}
      </div>
      </ProgressContext>
    </RenderContext>
  );
}

/** אתגר נחשב "נענה" כשהלומד הגיש אותו — כך הוא נשמר ב-`useBlockState` */
function isSubmitted(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { submitted?: unknown }).submitted === true;
}
