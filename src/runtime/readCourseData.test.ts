import { describe, expect, it } from 'vitest';
import { COURSE_DATA_ELEMENT_ID, readEmbeddedCourseData } from './readCourseData';

function documentWith(scriptContent: string | null): Document {
  const doc = document.implementation.createHTMLDocument('test');
  if (scriptContent !== null) {
    const script = doc.createElement('script');
    script.type = 'application/json';
    script.id = COURSE_DATA_ELEMENT_ID;
    script.textContent = scriptContent;
    doc.body.appendChild(script);
  }
  return doc;
}

describe('readEmbeddedCourseData', () => {
  it('קורא נתוני לומדה מתגית ה-JSON המוטמעת', () => {
    const payload = {
      version: '1.0',
      course: { id: 'course-1', title: 'לומדת בדיקה', chapters: [] },
      assets: [],
    };

    const result = readEmbeddedCourseData(documentWith(JSON.stringify(payload)));

    expect(result?.course.title).toBe('לומדת בדיקה');
  });

  it('שומר על תוכן עברי כולל תווים שדורשים escaping ב-HTML', () => {
    const title = 'הדרכה <עם> תגיות & סימנים "מיוחדים"';
    const payload = { version: '1.0', course: { id: 'c', title, chapters: [] }, assets: [] };

    const result = readEmbeddedCourseData(documentWith(JSON.stringify(payload)));

    expect(result?.course.title).toBe(title);
  });

  it('מחזיר null כשאין תגית נתונים', () => {
    expect(readEmbeddedCourseData(documentWith(null))).toBeNull();
  });

  it('מחזיר null במקום לזרוק כשה-JSON פגום', () => {
    expect(readEmbeddedCourseData(documentWith('{ לא JSON תקין'))).toBeNull();
  });
});
