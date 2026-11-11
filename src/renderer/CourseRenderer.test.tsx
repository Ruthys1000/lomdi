import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
import { createBlock } from '@/model/factory';
import { defaultTheme } from '@/model/themes';
import type { Block, Course } from '@/model/types';
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

describe('CourseRenderer — רצף למידה', () => {
  afterEach(() => window.localStorage.clear());

  const checklist: Block = {
    ...createBlock('checklist'),
    id: 'block-checklist',
    content: {
      items: [
        { id: 'item-1', text: 'לקרוא את הנוהל', description: '' },
        { id: 'item-2', text: 'לחתום על הטופס', description: '' },
      ],
      showCount: true,
    },
  };

  const sequenced: Course = {
    ...course,
    id: 'course-sequence',
    navigation: { ...defaultNavigation, mode: 'chapters', trackProgress: true },
    chapters: [
      { id: 'chapter-1', title: 'פתיחה', description: '', blocks: [checklist] },
      { id: 'chapter-2', title: 'עקרונות', description: '', blocks: [] },
    ],
  };

  it('סימון בצ׳ק-ליסט נשמר כשעוברים פרק וחוזרים', async () => {
    const user = userEvent.setup();
    render(<CourseRenderer course={sequenced} resolveAssetUrl={() => undefined} />);

    await user.click(screen.getByRole('checkbox', { name: /לקרוא את הנוהל/ }));
    await user.click(screen.getByRole('button', { name: /הבא/ }));
    expect(screen.queryByRole('checkbox', { name: /לקרוא את הנוהל/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: /הקודם/ }));
    expect(screen.getByRole('checkbox', { name: /לקרוא את הנוהל/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /לחתום על הטופס/ })).not.toBeChecked();
  });

  it('סימון בצ׳ק-ליסט נשמר אחרי טעינה מחדש של הלומדה', async () => {
    const user = userEvent.setup();
    const first = render(<CourseRenderer course={sequenced} resolveAssetUrl={() => undefined} />);
    await user.click(screen.getByRole('checkbox', { name: /לקרוא את הנוהל/ }));
    first.unmount();

    render(<CourseRenderer course={sequenced} resolveAssetUrl={() => undefined} />);
    expect(screen.getByRole('checkbox', { name: /לקרוא את הנוהל/ })).toBeChecked();
  });

  it('בקנבס העריכה מצב הבלוקים אינו נשמר כתשובת לומד', () => {
    render(<CourseRenderer course={sequenced} resolveAssetUrl={() => undefined} isEditing />);

    expect(window.localStorage.getItem('lc-progress:course-sequence')).toBeNull();
  });

  const quizBlock = (id: string): Block => ({
    ...createBlock('quiz'),
    id,
    content: {
      ...createBlock('quiz').content,
      question: `שאלה ${id}`,
      options: [
        { id: `${id}-right`, text: 'התשובה הנכונה', correct: true },
        { id: `${id}-wrong`, text: 'תשובה שגויה', correct: false },
      ],
      shuffle: false,
    },
  });

  const journey = (navigation: Partial<Course['navigation']>): Course => ({
    ...course,
    id: 'course-journey',
    navigation: { ...defaultNavigation, mode: 'chapters', trackProgress: true, ...navigation },
    chapters: [
      { id: 'j1', title: 'פתיחה', description: '', blocks: [quizBlock('q1')] },
      { id: 'j2', title: 'עקרונות', description: '', blocks: [quizBlock('q2')] },
      { id: 'j3', title: 'סיכום', description: '', blocks: [] },
    ],
  });

  const answer = async (user: ReturnType<typeof userEvent.setup>, text: RegExp) => {
    await user.click(screen.getByRole('radio', { name: text }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));
  };

  it('בסדר ליניארי פרקים שעוד לא נפתחו נעולים בתפריט, ונפתחים עם ההתקדמות', async () => {
    const user = userEvent.setup();
    render(
      <CourseRenderer course={journey({ sequence: 'linear' })} resolveAssetUrl={() => undefined} />,
    );

    // בהתחלה רק הפרק הראשון פתוח; לפרק הבא מגיעים ב"הבא", לא בקפיצה
    await user.click(screen.getByRole('button', { name: /תוכן העניינים/ }));
    expect(screen.getByRole('button', { name: /עקרונות \(נעול\)/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /סיכום \(נעול\)/ })).toBeDisabled();

    // התקדמות לפרק 2 משלימה את פרק 1; פרק 3 נשאר נעול עד שפרק 2 יושלם
    await user.click(screen.getByRole('button', { name: /^הבא/ }));
    await user.click(screen.getByRole('button', { name: /תוכן העניינים/ }));
    expect(screen.getByRole('button', { name: /פתיחה \(הושלם\)/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /עקרונות/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /סיכום \(נעול\)/ })).toBeDisabled();
  });

  it('בסדר חופשי אין נעילה', async () => {
    const user = userEvent.setup();
    render(<CourseRenderer course={journey({})} resolveAssetUrl={() => undefined} />);

    await user.click(screen.getByRole('button', { name: /תוכן העניינים/ }));
    await user.click(screen.getByRole('button', { name: /סיכום/ }));
    expect(screen.getByRole('main')).toHaveAccessibleName(/סיכום/);
  });

  it('״חובה לענות״ נועל את הבא עד שנענתה שאלת הפרק', async () => {
    const user = userEvent.setup();
    render(
      <CourseRenderer
        course={journey({ requireAnswersToAdvance: true })}
        resolveAssetUrl={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: /^הבא/ })).toBeDisabled();
    expect(screen.getByText('ענו על השאלות בפרק כדי להמשיך')).toBeInTheDocument();

    await answer(user, /תשובה שגויה/);
    expect(screen.getByRole('button', { name: /^הבא/ })).toBeEnabled();
  });

  it('מסך הסיום מציג עבר / לא עבר מול ציון המעבר, ומוביל לשאלה שנענתה לא נכון', async () => {
    const user = userEvent.setup();
    render(
      <CourseRenderer course={journey({ passScore: 100 })} resolveAssetUrl={() => undefined} />,
    );

    await answer(user, /התשובה הנכונה/);
    await user.click(screen.getByRole('button', { name: /^הבא/ }));
    await answer(user, /תשובה שגויה/);
    await user.click(screen.getByRole('button', { name: /^הבא/ }));
    await user.click(screen.getByRole('button', { name: /סיום/ }));

    expect(screen.getByRole('heading', { name: /עוד לא עברת/ })).toBeInTheDocument();
    expect(screen.getByText(/ציון המעבר הוא 100%/)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'פירוט לפי פרק' })).toHaveTextContent('עקרונות0 מתוך 1');

    await user.click(screen.getByRole('button', { name: /חזרה לשאלות שטעיתי בהן/ }));
    expect(screen.getByRole('main')).toHaveAccessibleName(/עקרונות/);
  });

  it('לומד שחוזר רואה מאיפה ממשיכים, ויכול להתחיל מחדש', async () => {
    const user = userEvent.setup();
    const first = render(<CourseRenderer course={journey({})} resolveAssetUrl={() => undefined} />);
    expect(screen.queryByText(/ברוכים השבים/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /^הבא/ }));
    first.unmount();

    render(<CourseRenderer course={journey({})} resolveAssetUrl={() => undefined} />);
    expect(screen.getByText(/ממשיכים מפרק 2: עקרונות/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'להתחיל מחדש' }));
    expect(screen.queryByText(/ברוכים השבים/)).toBeNull();
    expect(screen.getByRole('main')).toHaveAccessibleName(/פתיחה/);
  });
});
