import type { Block, Chapter } from './types';

/**
 * אומדן זמן למידה לפרק — כדי שמחבר של מסלול למידה יראה במתאר אם פרק אחד
 * ארוך פי שלושה מהאחרים.
 *
 * שכבת המודל אינה מכירה את קטלוג הבלוקים, ולכן הספירה גנרית: כל מחרוזת
 * בתוכן הבלוק נספרת כטקסט, חוץ משדות שאינם טקסט ללומד (מזהים, כתובות,
 * ערכי תצורה). זה אומדן לסדר-גודל, לא מדידה.
 */

/** קצב קריאה שמרני למסך, מילים לדקה */
const WORDS_PER_MINUTE = 180;
/** תוספת לבלוק שדורש מענה: לקרוא, לחשוב, לבחור ולקרוא משוב */
const INTERACTION_MINUTES = 0.5;

const INTERACTIVE_TYPES = new Set(['quiz', 'challenge', 'decision', 'checklist']);

/** שדות שערכם אינו טקסט שהלומד קורא */
const NON_TEXT_KEYS = new Set([
  'id',
  'type',
  'assetId',
  'url',
  'src',
  'href',
  'query',
  'imagePrompt',
  'alt',
  'variant',
  'mode',
  'source',
  'icon',
  'height',
  'layout',
  'backgroundType',
  'gradientFrom',
  'gradientTo',
  'labels',
  'attrs',
  'marks',
]);

function countWords(value: unknown): number {
  if (typeof value === 'string') return value.trim().split(/\s+/).filter(Boolean).length;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countWords(item), 0);
  if (typeof value !== 'object' || value === null) return 0;

  let words = 0;
  for (const [key, child] of Object.entries(value)) {
    if (!NON_TEXT_KEYS.has(key)) words += countWords(child);
  }
  return words;
}

export function blockWordCount(block: Block): number {
  return countWords(block.content);
}

/** דקות, מעוגל, ולפחות 1 לפרק שיש בו תוכן. פרק ריק = 0 */
export function chapterMinutes(chapter: Chapter): number {
  if (chapter.blocks.length === 0) return 0;
  const words = chapter.blocks.reduce((sum, block) => sum + blockWordCount(block), 0);
  const interactions = chapter.blocks.filter((block) => INTERACTIVE_TYPES.has(block.type)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE + interactions * INTERACTION_MINUTES));
}
