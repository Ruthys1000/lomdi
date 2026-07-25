import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import { SCHEMA_VERSION } from '@/model/types';
import type { EmbeddedCourseData } from '@/runtime/readCourseData';
import { COURSE_DATA_ELEMENT_ID } from '@/runtime/readCourseData';
import { buildIndexHtml, embedJson, escapeHtml } from './indexHtml';

const image: AssetMeta = {
  id: 'asset-a1b2c3d4e5',
  originalName: 'תמונה של המנכ"ל.png',
  safeName: 'asset-a1b2c3d4e5.png',
  kind: 'image',
  mimeType: 'image/png',
  size: 1024,
  exportPath: 'assets/images/asset-a1b2c3d4e5.png',
};

function payload(overrides: Partial<EmbeddedCourseData> = {}): EmbeddedCourseData {
  return {
    version: SCHEMA_VERSION,
    course: createCourse({
      title: 'לומדת בטיחות',
      chapters: [createChapter({ title: 'פרק ראשון', blocks: [createBlock('richText')] })],
    }),
    assets: [image],
    ...overrides,
  };
}

/** התוכן של תגית ה-JSON המוטמעת, כפי שהדפדפן היה קורא אותה */
function embeddedData(html: string): EmbeddedCourseData {
  const match = new RegExp(
    `<script type="application/json" id="${COURSE_DATA_ELEMENT_ID}">(.*?)</script>`,
    's',
  ).exec(html);

  if (!match) throw new Error('לא נמצאה תגית הנתונים ב-index.html');
  return JSON.parse(match[1]) as EmbeddedCourseData;
}

describe('הטמעת הנתונים', () => {
  it('שורדת תוכן שמכיל סגירת תגית script', () => {
    const html = buildIndexHtml(
      payload({
        course: createCourse({ title: 'הדרכה </script><script>alert(1)</script>' }),
      }),
    );

    // התגית נסגרת פעם אחת בלבד — כלומר הטקסט לא ברח מתוכה
    expect(html.match(/<\/script>/g)).toHaveLength(2); // תגית הנתונים + תגית החבילה
    expect(embeddedData(html).course.title).toBe('הדרכה </script><script>alert(1)</script>');
  });

  it('שומרת עברית, גרשיים ותווים מיוחדים אחרי JSON.parse', () => {
    const html = buildIndexHtml(
      payload({ course: createCourse({ title: 'בטיחות & "מרכאות" <סוגריים>' }) }),
    );

    expect(embeddedData(html).course.title).toBe('בטיחות & "מרכאות" <סוגריים>');
  });

  it('מטמיעה את רשימת הנכסים, שממנה הרנדרר גוזר את הנתיבים', () => {
    expect(embeddedData(buildIndexHtml(payload())).assets[0].exportPath).toBe(image.exportPath);
  });

  it('embedJson אינו משאיר תו < שיכול לסגור תגית', () => {
    expect(embedJson({ text: '</script>' })).not.toContain('<');
  });

  it('escapeHtml מנטרל תווים שמשנים את מבנה ה-HTML', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});

describe('מבנה index.html', () => {
  it('טוען את החבילה כסקריפט קלאסי — מודול אינו רץ מ-file://', () => {
    const html = buildIndexHtml(payload());

    expect(html).toContain('<script src="runtime/app.js"></script>');
    expect(html).not.toContain('type="module"');
  });

  it('משתמש בנתיבים יחסיים בלבד, בלי מארח ובלי נתיב מוחלט', () => {
    const html = buildIndexHtml(payload());

    expect(html).toContain('href="runtime/styles.css"');
    expect(html).not.toContain('src="/');
    expect(html).not.toContain('href="/');
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://www.');
  });

  it('אינו מכיל כתובת blob או localhost', () => {
    const html = buildIndexHtml(payload());

    expect(html).not.toContain('blob:');
    expect(html).not.toContain('localhost');
  });

  it('כותב את כיוון הכתיבה, השפה והכותרת עוד לפני שה-JS רץ', () => {
    const html = buildIndexHtml(payload());

    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain('<title>לומדת בטיחות</title>');
  });

  it('מכיל את משתני ערכת העיצוב inline, מאותה פונקציה שהעורך משתמש בה', () => {
    const data = payload();
    const html = buildIndexHtml(data);

    expect(html).toContain(`--lc-color-primary: ${data.course.theme.colors.primary};`);
    expect(html).toContain('--lc-content-max-width:');
  });

  it('מאפס את שוליי המסמך וצובע אותו — course.css מעצב רק את .lc-course', () => {
    const data = payload();
    const html = buildIndexHtml(data);

    expect(html).toContain('html, body { margin: 0; padding: 0; }');
    expect(html).toContain(`background: ${data.course.theme.colors.background}`);
  });

  it('מקשר לגופן שהערכה בחרה, בנתיב יחסי', () => {
    const html = buildIndexHtml(payload());

    // ברירת המחדל היא Heebo, והוא נארז לתוך ה-ZIP
    expect(html).toContain('<link rel="stylesheet" href="fonts/heebo.css" />');
  });

  it('אינו מקשר לגופן כשהערכה משתמשת בגופן המערכת', () => {
    const data = payload();
    const course = {
      ...data.course,
      theme: {
        ...data.course.theme,
        typography: { ...data.course.theme.typography, fontFamily: 'system' as const },
      },
    };

    expect(buildIndexHtml({ ...data, course })).not.toContain('fonts/');
  });

  it('מציג מצב טעינה ו-noscript, כדי שהמסך לא יהיה לבן וריק', () => {
    const html = buildIndexHtml(payload());

    expect(html).toContain('טוען את הלומדה');
    expect(html).toContain('<noscript>');
    expect(html).toContain('id="lc-root"');
  });
});
