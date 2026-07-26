import type { TemplateAsset } from '@/sample/illustrations';
import type { Course } from '@/model/types';

/**
 * מה שתבנית מייצרת.
 *
 * תבנית מחזירה גם נכסים ולא רק `Course`, כי איורי התבנית נבנים בזמן
 * היצירה ומקבלים מזהה חדש בכל פעם — ולכן אי אפשר לכתוב אותם מראש לתוך
 * הבלוקים. הטיפוס יושב בקובץ נפרד ולא ב-`templates/index.ts` כדי
 * ש-`sample/sampleCourse.ts` יוכל לייבא אותו בלי מעגל ייבוא.
 */
export interface TemplateResult {
  course: Course;
  assets: TemplateAsset[];
}
