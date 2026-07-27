import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
import { defaultTheme } from '@/model/themes';
import type { Course } from '@/model/types';
import { CourseRenderer } from './CourseRenderer';

const course: Course = {
  id: 'course-1',
  title: 'לומדה לבדיקת ניווט',
  subtitle: '',
  description: '',
  direction: 'rtl',
  language: 'he',
  theme: defaultTheme,
  navigation: { ...defaultNavigation, mode: 'chapters', showChapterMenu: true },
  chapters: [
    { id: 'c1', title: 'פרק ראשון', description: '', blocks: [] },
    { id: 'c2', title: 'פרק שני', description: '', blocks: [] },
    { id: 'c3', title: 'פרק שלישי', description: '', blocks: [] },
  ],
};

describe('ChapterNavigation — נגישות ומקלדת', () => {
  it('מציג קישור דילוג לתוכן שמכוון אל <main>', () => {
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);
    const skip = screen.getByRole('link', { name: 'דלג לתוכן' });
    expect(skip).toHaveAttribute('href', '#lc-main');
    expect(document.getElementById('lc-main')).toBeInstanceOf(HTMLElement);
  });

  it('חץ שמאלה עובר לפרק הבא ב-RTL, וחץ ימינה חוזר אחורה', async () => {
    const user = userEvent.setup();
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);

    expect(screen.getByRole('main')).toHaveAccessibleName(/פרק ראשון/);

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('main')).toHaveAccessibleName(/פרק שני/);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('main')).toHaveAccessibleName(/פרק ראשון/);
  });

  it('חץ ימינה בפרק הראשון (RTL) אינו יוצא מהגבול', async () => {
    const user = userEvent.setup();
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('main')).toHaveAccessibleName(/פרק ראשון/);
  });

  it('מעביר פוקוס לגוף הפרק במעבר, ולא בטעינה הראשונית', async () => {
    const user = userEvent.setup();
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);

    // בטעינה הראשונית הפוקוס אינו נחטף אל גוף הפרק
    expect(screen.getByRole('main')).not.toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('סוגר את תפריט הפרקים בלחיצה מחוץ לו', async () => {
    const user = userEvent.setup();
    render(<CourseRenderer course={course} resolveAssetUrl={() => undefined} />);

    await user.click(screen.getByRole('button', { name: defaultNavigation.labels.menu }));
    expect(screen.getByRole('button', { name: /פרק שני/ })).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('button', { name: /פרק שני/ })).toBeNull();
  });
});
