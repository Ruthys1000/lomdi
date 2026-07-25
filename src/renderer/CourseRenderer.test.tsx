import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
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
