import { getSharedBlockDefinition } from '@/blocks/registry.shared';
import { createBlockSettings, defaultNavigation } from './defaults';
import { createId } from './ids';
import { defaultTheme } from './themes';
import type { Block, BlockContent, BlockSettings, Chapter, Course } from './types';

/** יוצרי הישויות של המודל. כולם מחזירים אובייקטים חדשים עם מזהים חדשים. */

export function createBlock(
  type: string,
  overrides: { content?: BlockContent; settings?: Partial<BlockSettings> } = {},
): Block {
  const definition = getSharedBlockDefinition(type);
  if (!definition) throw new Error(`סוג בלוק שאינו מוכר: ${type}`);

  return {
    id: createId('block'),
    type,
    content: overrides.content ?? (definition.createContent() as BlockContent),
    settings: createBlockSettings({ ...definition.defaultSettings, ...overrides.settings }),
  };
}

export function createChapter(overrides: Partial<Omit<Chapter, 'id'>> = {}): Chapter {
  return {
    id: createId('chapter'),
    title: 'פרק חדש',
    description: '',
    blocks: [],
    ...overrides,
  };
}

export function createCourse(overrides: Partial<Omit<Course, 'id'>> = {}): Course {
  return {
    id: createId('course'),
    title: 'לומדה חדשה',
    subtitle: '',
    description: '',
    direction: 'rtl',
    language: 'he',
    theme: defaultTheme,
    navigation: defaultNavigation,
    chapters: [createChapter({ title: 'פרק ראשון' })],
    ...overrides,
  };
}

/**
 * שכפול עמוק עם מזהים חדשים.
 *
 * חשוב שהמזהים יתחלפו ולא רק התוכן: מזהה משוכפל היה שובר בחירה, גרירה
 * ומפתחות React, ובייצוא היה גורם לשני בלוקים להיחשב לאותו בלוק.
 */
export function duplicateBlock(block: Block): Block {
  return {
    ...structuredClone(block),
    id: createId('block'),
  };
}

export function duplicateChapter(chapter: Chapter): Chapter {
  const clone = structuredClone(chapter);
  return {
    ...clone,
    id: createId('chapter'),
    title: `${chapter.title} (עותק)`,
    blocks: clone.blocks.map((block) => ({ ...block, id: createId('block') })),
  };
}
