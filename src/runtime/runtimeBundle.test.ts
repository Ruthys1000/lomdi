// @vitest-environment node
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
import { defaultTheme } from '@/model/themes';

/**
 * בדיקת האינטגרציה החשובה ביותר בפרויקט.
 *
 * היא מרכיבה index.html מינימלי כמו זה שהייצוא מייצר, מריצה מעליו את חבילת
 * ה-runtime הבנויה תחת כתובת file://, ומוודאת שהלומדה עולה בלי שרת ובלי
 * שגיאות. זהו השומר על הסיכון המרכזי בארכיטקטורה: רנדרר שנשבר או התיישן
 * היה מתגלה רק אחרי ייצוא ופריקת ZIP ידנית.
 *
 * דורשת `npm run build:runtime`. בלעדיה הבדיקה נכשלת בהודעה מפורשת ולא
 * מדלגת בשקט — דילוג שקט היה מחזיר בדיוק את נקודת העיוורון שהיא מונעת.
 */

const BUNDLE = 'public/runtime/app.js';

const course = {
  id: 'course-test',
  title: 'איך בונים הדרכה דיגיטלית אפקטיבית',
  subtitle: '',
  description: '',
  direction: 'rtl',
  language: 'he',
  theme: defaultTheme,
  // גלילה רציפה, כדי שהבדיקה תראה את שני הפרקים בלי לנווט ביניהם
  navigation: { ...defaultNavigation, mode: 'scroll' },
  chapters: [
    { id: 'chapter-1', title: 'פתיחה', description: '', blocks: [] },
    { id: 'chapter-2', title: 'עקרונות מנחים', description: '', blocks: [] },
  ],
};

let bundle: string;

beforeAll(() => {
  try {
    bundle = readFileSync(BUNDLE, 'utf8');
  } catch {
    throw new Error(`לא נמצאה חבילת ה-runtime ב-${BUNDLE}. הרץ תחילה: npm run build:runtime`);
  }
});

interface RenderResult {
  document: Document;
  messages: string[];
}

function renderExportedCourse(data: unknown): Promise<RenderResult> {
  // "<" חייב escaping — אחרת "</script>" בתוך תוכן הלומדה היה סוגר את התגית
  const embedded = JSON.stringify(data).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><title>טוען…</title></head>
<body>
<script type="application/json" id="lc-course-data">${embedded}</script>
<div id="lc-root"></div>
<script>${bundle}</script>
</body></html>`;

  const messages: string[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (m) => messages.push(`error: ${m}`));
  virtualConsole.on('warn', (m) => messages.push(`warn: ${m}`));
  virtualConsole.on('jsdomError', (e: Error) => messages.push(`jsdomError: ${e.message}`));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'file:///tmp/course/index.html', // התרחיש שסעיף 17 דורש
    virtualConsole,
  });

  return new Promise((resolve) =>
    setTimeout(() => resolve({ document: dom.window.document, messages }), 300),
  );
}

/**
 * כלל ה-ESLint שאוסר על אזור הרנדרר לייבא קוד עורך תופס ייבוא ישיר בלבד.
 * הוא אינו יכול לתפוס דליפה עקיפה — וזו כבר קרתה: ה-Renderer של הווידאו
 * ייבא פונקציית עזר כערך מקובץ שמייבא zod, וכל ספריית הסכמות נכנסה
 * לחבילה שהלומד מוריד (52KB).
 *
 * הבדיקה הזו רצה על התוצר הבנוי עצמו, ולכן היא היחידה שתופסת דליפה
 * שנכנסה דרך שרשרת ייבוא ולא דרך שורת import אחת.
 */
describe('גבול חבילת ה-runtime', () => {
  const FORBIDDEN = [
    { name: 'zod', fingerprint: 'ZodError' },
    { name: 'TipTap', fingerprint: 'tiptap' },
    { name: 'ProseMirror', fingerprint: 'prosemirror' },
    { name: 'dnd-kit', fingerprint: 'dnd-kit' },
    { name: 'zustand', fingerprint: 'zustand' },
    { name: 'JSZip', fingerprint: 'JSZip' },
  ];

  it.each(FORBIDDEN)('אינה מכילה את $name', ({ fingerprint }) => {
    expect(bundle.toLowerCase()).not.toContain(fingerprint.toLowerCase());
  });

  it('מכילה Renderer לכל תשעת סוגי הבלוקים', () => {
    for (const type of [
      'hero',
      'richText',
      'image',
      'textImage',
      'divider',
      'cards',
      'accordion',
      'video',
      'quiz',
    ]) {
      expect(bundle).toContain(type);
    }
  });

  it('אינה מפנה לשום מארח חיצוני מלבד שירותי הווידאו שהמשתמש בוחר', () => {
    const hosts = new Set(
      [...bundle.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((match) => match[1].toLowerCase()),
    );

    const allowed = new Set([
      'www.youtube-nocookie.com',
      'player.vimeo.com',
      'react.dev', // מופיע רק בטקסט של הודעות שגיאה של React
      'www.w3.org', // מרחבי שמות של SVG ו-MathML, לא בקשות רשת
    ]);

    expect([...hosts].filter((host) => !allowed.has(host))).toEqual([]);
  });
});

describe('חבילת ה-runtime המיוצאת', () => {
  it('מרנדרת את הלומדה מ-JSON מוטמע תחת file:// ללא שרת וללא שגיאות קונסולה', async () => {
    const { document, messages } = await renderExportedCourse({ version: '1.0', course, assets: [] });

    expect(messages).toEqual([]);
    expect(document.querySelector('.lc-course')).not.toBeNull();
    expect(document.querySelectorAll('.lc-chapter')).toHaveLength(2);
    expect(document.title).toBe(course.title);
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
  });

  it('שומרת על תוכן עברי ועל תווים שדורשים escaping', async () => {
    const tricky = {
      ...course,
      title: 'הדרכה <script> & "מרכאות"',
      chapters: [{ id: 'chapter-1', title: 'פרק <עם> תגיות', description: '', blocks: [] }],
    };

    const { document, messages } = await renderExportedCourse({
      version: '1.0',
      course: tricky,
      assets: [],
    });

    expect(messages).toEqual([]);
    expect(document.title).toBe('הדרכה <script> & "מרכאות"');
    expect(document.querySelector('.lc-chapter')?.getAttribute('aria-label')).toBe(
      'פרק <עם> תגיות',
    );
  });

  it('מציגה הודעת שגיאה ידידותית כשנתוני הלומדה חסרים', async () => {
    const { document } = await renderExportedCourse(null);
    const alert = document.querySelector('[role="alert"]');

    expect(alert?.textContent).toContain('לא נמצאו נתוני לומדה');
  });
});
