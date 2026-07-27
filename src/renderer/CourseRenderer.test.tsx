import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
import { createBlock } from '@/model/factory';
import { defaultTheme } from '@/model/themes';
import type { Course } from '@/model/types';
import { CourseRenderer } from './CourseRenderer';

const course: Course = {
  id: 'course-1',
  title: 'איך בונים הדרכה דיגיטלית אפקטיבית',
  subtitle: '',
  description: '',
  direction: 'rtl',
  language: 'he',
  theme: defaultTheme,
  navigation: { ...defaultNavigation, mode: 'scroll' },
  chapters: [
    { id: 'chapter-1', title: 'פתיחה', description: '', blocks: [] },
    { id: 'chapter-2', title: 'עקרונות', description: '', blocks: [] },
  ],
};

describe('CourseRenderer', () => {
  it('מרנדר כל פרק כאלמנט section עם שם נגיש', () => {
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);

    expect(screen.getByRole('region', { name: 'פתיחה' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'עקרונות' })).toBeInTheDocument();
  });

  it('מגדיר כיוון ושפה על שורש הלומדה', () => {
    const { container } = render(
      <CourseRenderer course={course} resolveAssetUrl={() => undefined} />,
    );
    const root = container.querySelector('.lc-course');

    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('lang', 'he');
  });

  it('מרנדר כותרת פרק נראית עם eyebrow "פרק N" במצב גלילה', () => {
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);

    // הכותרת מופיעה חזותית כ-heading, לא רק כתווית aria על ה-section
    expect(screen.getByRole('heading', { name: 'פתיחה' })).toBeInTheDocument();
    expect(screen.getByText('פרק 1')).toBeInTheDocument();
    expect(screen.getByText('פרק 2')).toBeInTheDocument();
  });

  it('מדלג על כותרת הפרק כשהפרק פותח ב-hero (ה-hero הוא הכותרת)', () => {
    const heroFirst: Course = {
      ...course,
      chapters: [
        { id: 'c1', title: 'פתיחה', description: 'תיאור הפרק', blocks: [createBlock('hero')] },
      ],
    };
    render(<CourseRenderer course={heroFirst} resolveAssetUrl={() => undefined} />);

    // אין eyebrow ואין כותרת פרק — ה-hero פותח את הפרק לבדו
    expect(screen.queryByText('פרק 1')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'פתיחה' })).toBeNull();
    expect(screen.queryByText('תיאור הפרק')).toBeNull();
  });

  it('אינו מציג eyebrow "פרק N" במצב פרקים (המונה כבר בסרגל)', () => {
    const chaptersMode: Course = {
      ...course,
      navigation: { ...defaultNavigation, mode: 'chapters' },
    };
    render(<CourseRenderer course={chaptersMode} resolveAssetUrl={() => undefined} />);

    // הכותרת עצמה כן מוצגת, אבל בלי ה-eyebrow שמשכפל את המונה בסרגל
    expect(screen.getByRole('heading', { name: 'פתיחה' })).toBeInTheDocument();
    expect(screen.queryByText('פרק 1')).toBeNull();
  });

  it('לומדה בלי פרקים אינה קורסת — בשני מצבי הניווט', () => {
    // סכמת הקורס אינה דורשת מינימום פרק אחד, ולכן תוכן שנוצר דינמית (בעתיד
    // ע"י AI) עלול להגיע ריק. הרנדרר המשותף — שרץ גם בתוצר ה-offline בלי
    // dev-tools — חייב להציג ריק בשקט ולא מסך לבן.
    const empty: Course = { ...course, chapters: [] };

    const scroll = render(<CourseRenderer course={empty} resolveAssetUrl={() => undefined} />);
    expect(scroll.container.querySelector('.lc-course')).toBeInTheDocument();
    scroll.unmount();

    const chapters = render(
      <CourseRenderer
        course={{ ...empty, navigation: { ...defaultNavigation, mode: 'chapters' } }}
        resolveAssetUrl={() => undefined}
      />,
    );
    expect(chapters.container.querySelector('.lc-course')).toBeInTheDocument();
  });

  it('בעורך משתמש ב-renderEmptyChapter לפרק ריק, ומעביר את מזהה הפרק', () => {
    const emptyChapter: Course = {
      ...course,
      chapters: [{ id: 'chapter-9', title: 'ריק', description: '', blocks: [] }],
    };

    render(
      <CourseRenderer
        course={emptyChapter}
        resolveAssetUrl={() => undefined}
        isEditing
        renderEmptyChapter={(chapterId) => <button type="button">הוסיפו ל-{chapterId}</button>}
      />,
    );

    // ה-CTA האינטראקטיבי מחליף את הטקסט הפסיבי, ומקבל את מזהה הפרק הנכון
    expect(screen.getByRole('button', { name: 'הוסיפו ל-chapter-9' })).toBeInTheDocument();
    expect(screen.queryByText('הפרק ריק. הוסיפו בלוק כדי להתחיל.')).toBeNull();
  });

  it('בלי renderEmptyChapter, פרק ריק בעורך מציג את הטקסט הפסיבי', () => {
    const emptyChapter: Course = {
      ...course,
      chapters: [{ id: 'chapter-9', title: 'ריק', description: '', blocks: [] }],
    };

    render(<CourseRenderer course={emptyChapter} resolveAssetUrl={() => undefined} isEditing />);

    expect(screen.getByText('הפרק ריק. הוסיפו בלוק כדי להתחיל.')).toBeInTheDocument();
  });

  it('מדלג בשקט על בלוק מסוג לא מוכר בתוצר, ומסמן אותו בעורך', () => {
    const withUnknown: Course = {
      ...course,
      chapters: [
        {
          id: 'chapter-1',
          title: 'פתיחה',
          description: '',
          blocks: [
            {
              id: 'block-1',
              type: 'futureBlockType',
              content: {},
              settings: {
                width: 'normal',
                alignment: 'start',
                background: 'transparent',
                spacingTop: 'medium',
                spacingBottom: 'medium',
              },
            },
          ],
        },
      ],
    };

    const exported = render(
      <CourseRenderer course={withUnknown} resolveAssetUrl={() => undefined} />,
    );
    expect(exported.queryByRole('note')).toBeNull();
    exported.unmount();

    render(<CourseRenderer course={withUnknown} resolveAssetUrl={() => undefined} isEditing />);
    expect(screen.getByRole('note')).toHaveTextContent('futureBlockType');
  });
});
