import { customAlphabet } from 'nanoid';

/**
 * מזהים ייחודיים ויציבים לכל פרק, בלוק ונכס (סעיף 6 באפיון).
 *
 * האלפבית מצומצם לאותיות קטנות וספרות בכוונה: המזהים משמשים גם כחלק
 * משמות קבצים בתוצר המיוצא, ותווים כמו '-' או '_' של האלפבית הדיפולטי
 * של nanoid מקשים על קריאה ועל השוואה במערכות קבצים לא רגישות לרישיות.
 */
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const generate = customAlphabet(alphabet, 10);

export type IdPrefix =
  | 'course'
  | 'chapter'
  | 'block'
  | 'asset'
  | 'item'
  | 'card'
  | 'option'
  | 'stat'
  | 'step'
  | 'checklistItem';

export function createId(prefix: IdPrefix): string {
  return `${prefix}-${generate()}`;
}
