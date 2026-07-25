import type { BlockSettings, NavigationSettings } from './types';

export const defaultBlockSettings: BlockSettings = {
  width: 'normal',
  alignment: 'start',
  background: 'transparent',
  spacingTop: 'medium',
  spacingBottom: 'medium',
};

export const defaultNavigation: NavigationSettings = {
  mode: 'chapters',
  showProgress: true,
  showChapterMenu: true,
  showChapterNumber: true,
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
