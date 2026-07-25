import type { BlockSettings } from '@/model/types';

/**
 * ממירה את הגדרות הבלוק לקלאסים.
 *
 * משותפת לקנבס העריכה ולתוצר, כך שהגדרה שנראית נכון בעורך נראית זהה
 * בייצוא. הקלאסים עצמם מוגדרים ב-course.css ומבוססים על CSS logical
 * properties, ולכן 'start' ו-'end' עובדים גם ב-RTL וגם ב-LTR.
 */
export function blockClassName(settings: BlockSettings): string {
  return [
    'lc-block',
    `lc-block--w-${settings.width}`,
    `lc-block--align-${settings.alignment}`,
    `lc-block--bg-${settings.background}`,
    `lc-block--pt-${settings.spacingTop}`,
    `lc-block--pb-${settings.spacingBottom}`,
  ].join(' ');
}
