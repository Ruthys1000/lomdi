import type { BlockSettings, NavigationSettings } from './types';

export const defaultBlockSettings: BlockSettings = {
  width: 'normal',
  alignment: 'start',
  background: 'transparent',
  /* small ולא medium: medium+medium בין בלוקים סמוכים יצר רווח לבן גדול מדי
     במובייל. מי שרוצה אוויר יכול להעלות ל-medium/large בפאנל. */
  spacingTop: 'small',
  spacingBottom: 'small',
};

export const defaultNavigation: NavigationSettings = {
  mode: 'scroll',
  showProgress: true,
  showChapterMenu: true,
  showChapterNumber: true,
  trackProgress: true,
  labels: {
    next: 'הבא',
    prev: 'הקודם',
    menu: 'תוכן העניינים',
    chapter: 'פרק',
  },
};

export function createBlockSettings(overrides: Partial<BlockSettings> = {}): BlockSettings {
  return { ...defaultBlockSettings, ...overrides };
}
