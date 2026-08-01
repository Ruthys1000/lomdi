import { SCHEMA_VERSION } from '@/model/types';
import type { Course } from '@/model/types';
import { validateProjectFile } from '@/model/validate';
import { APP_NAME, APP_VERSION } from '@/version';
import { coerceGeneratedCourse } from './coerceCourse';
import type { ImageIntent } from './imageIntent';
import { refineCourse } from './refineCourse';
import type { VisualStyle } from './visualStyle';

/**
 * הצינור המלא: JSON גולמי מ-AI → לומדה תקינה, ערוכה ומאומתת.
 *
 * מרכיב את שלושת השלבים בסדר הנכון — ריפוי (`coerceGeneratedCourse`),
 * טעם עריכה (`refineCourse`), ורשת ביטחון (`validateProjectFile`, אותו
 * אימות שרץ בטעינת קובץ פרויקט) — ומאחד את כל האזהרות למקבץ אחד להצגה
 * למשתמש. אין כאן קריאת LLM: הקלט הוא כבר ה-JSON שהמודל החזיר.
 */

export interface GeneratedCourse {
  course: Course;
  imageIntents: ImageIntent[];
  /** ה-art direction ללומדה — מוזרק ל-resolver כדי לייצר סט תמונות קוהרנטי */
  visualStyle: VisualStyle;
  warnings: string[];
}

export interface ImportGeneratedOptions {
  /** ברירת מחדל true. כבה כדי לקבל את הפלט המרוּפא בלי הוספות עריכה */
  refine?: boolean;
}

export function importGeneratedCourse(
  raw: unknown,
  options: ImportGeneratedOptions = {},
): GeneratedCourse {
  const coerced = coerceGeneratedCourse(raw);
  const warnings = [...coerced.warnings];
  let course = coerced.course;

  if (options.refine !== false) {
    const refined = refineCourse(course);
    course = refined.course;
    warnings.push(...refined.warnings);
  }

  const validation = validateProjectFile({
    version: SCHEMA_VERSION,
    generator: { name: APP_NAME, version: APP_VERSION },
    savedAt: new Date().toISOString(),
    course,
    assets: [],
  });
  if (!validation.ok) {
    warnings.push(`אימות סופי מצא בעיה בלתי צפויה: ${validation.errors[0]}`);
  }

  return { course, imageIntents: coerced.imageIntents, visualStyle: coerced.visualStyle, warnings };
}
