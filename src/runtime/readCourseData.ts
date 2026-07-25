import type { AssetMeta, Course } from '@/model/types';

export const COURSE_DATA_ELEMENT_ID = 'lc-course-data';

export interface EmbeddedCourseData {
  version: string;
  course: Course;
  assets: AssetMeta[];
}

/**
 * קורא את נתוני הלומדה.
 *
 * מקור ראשי: תגית <script type="application/json"> מוטמעת ב-index.html.
 * זו הסיבה שהתוצר עובד בפתיחה ישירה מ-file:// בלי שרת — דפדפנים חוסמים
 * fetch של קובץ מקומי, אבל JSON מוטמע נקרא מה-DOM.
 *
 * content.json נכתב לצד ה-HTML לצורך ניידות ועריכה עתידית, ומשמש כאן
 * כגיבוי בלבד — למשל אם מישהו מגיש את התיקייה משרת ומחליף רק את ה-JSON.
 */
export function readEmbeddedCourseData(doc: Document = document): EmbeddedCourseData | null {
  const el = doc.getElementById(COURSE_DATA_ELEMENT_ID);
  if (!el?.textContent) return null;

  try {
    return JSON.parse(el.textContent) as EmbeddedCourseData;
  } catch {
    return null;
  }
}

export async function fetchCourseDataFallback(
  url = 'content.json',
): Promise<EmbeddedCourseData | null> {
  // ב-file:// הבקשה תיכשל — זה צפוי, ולכן היא עטופה ולא מדווחת כשגיאה.
  if (window.location.protocol === 'file:') return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as EmbeddedCourseData;
  } catch {
    return null;
  }
}

export async function loadCourseData(): Promise<EmbeddedCourseData | null> {
  return readEmbeddedCourseData() ?? (await fetchCourseDataFallback());
}
