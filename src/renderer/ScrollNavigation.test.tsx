import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
import { defaultTheme } from '@/model/themes';
import type { Course } from '@/model/types';
import { CourseRenderer } from './CourseRenderer';

const base: Course = {
  id: 'course-1',
  title: 'לומדה',
  subtitle: '',
  description: '',
  direction: 'rtl',
  language: 'he',
  theme: defaultTheme,
  navigation: { ...defaultNavigation, mode: 'scroll' },
  chapters: [{ id: 'c1', title: 'פתיחה', description: '', blocks: [] }],
};

describe('ScrollNavigation — פס התקדמות', () => {
  it('מציג פס התקדמות במצב גלילה כש-showProgress פעיל', () => {
    const { container } = render(
      <CourseRenderer course={base} resolveAssetUrl={() => undefined} />,
    );
    expect(container.querySelector('.lc-reading-progress')).not.toBeNull();
  });

  it('אינו מציג פס התקדמות כש-showProgress כבוי', () => {
    const noProgress: Course = {
      ...base,
      navigation: { ...defaultNavigation, mode: 'scroll', showProgress: false },
    };
    const { container } = render(
      <CourseRenderer course={noProgress} resolveAssetUrl={() => undefined} />,
    );
    expect(container.querySelector('.lc-reading-progress')).toBeNull();
  });
});
