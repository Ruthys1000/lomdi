import { collectCourseAssetIds } from '@/model/assets';
import type { AssetMeta, Course } from '@/model/types';
import { SCHEMA_VERSION } from '@/model/types';
import type { EmbeddedCourseData } from '@/runtime/readCourseData';

/**
 * מה שנכנס לתוצר — הנתונים שהלומדה המיוצאת קוראת.
 *
 * זהו בדיוק המבנה ש-`runtime/readCourseData` מצפה לו, והטיפוס מיובא משם
 * ולא מוגדר כאן פעם שנייה: הצד שכותב והצד שקורא חייבים להישבר יחד אם
 * המבנה משתנה.
 *
 * **רשימת הנכסים מסוננת לנכסים שבשימוש בלבד.** נכס שאיש אינו מפנה אליו
 * לא נארז ל-ZIP, ולכן אסור שיופיע גם ברשימה — `resolveAssetUrl` בתוצר
 * מחזיר את `exportPath` של כל נכס שברשימה, וכתובת לקובץ שאינו בארכיון
 * היא בדיוק התמונה השבורה שהמשתמש יגלה רק אצל הלומד.
 */
export function buildExportPayload(course: Course, assets: AssetMeta[]): EmbeddedCourseData {
  const used = collectCourseAssetIds(course);

  return {
    version: SCHEMA_VERSION,
    course,
    assets: assets.filter((asset) => used.has(asset.id)),
  };
}
