import { SCHEMA_VERSION } from '@/model/types';
import type { Course } from '@/model/types';
import { validateProjectFile } from '@/model/validate';
import { APP_NAME, APP_VERSION } from '@/version';
import { coerceGeneratedCourse } from './coerceCourse';
import { refineCourse } from './refineCourse';

/**
 * הצינור המלא: JSON גולמי מ-AI → לומדה תקינה, ערוכה ומאומתת.
 *
 * מרכיב את שלושת השלבים בסדר הנכון — ריפוי (`coerceGeneratedCourse`),
 * טעם עריכה (`refineCourse`), ורשת ביטחון (`validateProjectFile`, אותו
 * אימות שרץ בטעינת קובץ פרויקט) — ומאחד את כל האזהרות למקבץ אחד להצגה
 * למשתמש. אין כאן קריאת LLM: הקלט הוא כבר ה-JSON שהמודל החזיר.
 *
 * תמונות אינן נפתרות: כל בלוק תמונה נשאר עם placeholder ופרומפט מומלץ
 * (`imagePrompt`) שהמשתמש יכול להעתיק למחולל תמונות משלו.
 */

export interface GeneratedCourse {
  course: Course;
  warnings: string[];
}

export interface ImportGeneratedOptions {
  /** ברירת מחדל true. כבה כדי לקבל את הפלט המרוּפא בלי הוספות עריכה */
  refine?: boolean;
  /** מזהה הפורמט שנבחר בצד הלקוח — מוזרק ל-`Course.format` */
  format?: string;
}

export function importGeneratedCourse(
  raw: unknown,
  options: ImportGeneratedOptions = {},
): GeneratedCourse {
  const coerced = coerceGeneratedCourse(raw, options.format);
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

  return { course, warnings };
}
