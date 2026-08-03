import { themeToCssVars } from '@/renderer/theme/themeToCssVars';
import { COURSE_DATA_ELEMENT_ID, type EmbeddedCourseData } from '@/runtime/readCourseData';
import { APP_NAME, APP_VERSION } from '@/version';
import { fontCssPaths } from './fonts';

/**
 * `index.html` של הלומדה המיוצאת.
 *
 * הקובץ הזה הוא כל מה שעומד בין הנתונים לבין הלומד, והוא נבנה כאן פעם
 * אחת — בעורך, בזמן הייצוא. אין בו לוגיקה ואין בו קוד שמייצר HTML בזמן
 * ריצה, ולכן מוסכמת "אין המרת מחרוזת ל-HTML" נשמרת גם בתוצר.
 *
 * ארבע החלטות שקובעות אם הקובץ באמת עובד בדאבל-קליק:
 *
 * 1. **`<script src>` קלאסי, לא `type="module"`.** מודול נטען כבקשת CORS,
 *    ותחת `file://` המקור הוא `null` — כלומר מודול פשוט לא ירוץ. זו הסיבה
 *    ש-`vite.runtime.config.ts` בונה IIFE יחיד ולא ESM.
 * 2. **הנתונים מוטמעים בתגית JSON ולא נטענים ב-fetch.** דפדפנים חוסמים
 *    `fetch` של קובץ מקומי. `content.json` נכתב לצד ה-HTML כגיבוי לשימוש
 *    משרת בלבד.
 * 3. **כל הנתיבים יחסיים.** אין `/` מוביל ואין מארח — התיקייה חייבת
 *    לעבוד גם בשורש דיסק, גם בתת-תיקייה של Moodle וגם על Disk-on-key.
 * 4. **שכבת מסמך משלה.** `course.css` מעצב את `.lc-course` בלבד, ובתוצר
 *    הוא לבד במסמך (מוסכמה 7). בלי איפוס ל-`html`/`body` הייתה מסגרת
 *    לבנה סביב לומדה בערכה כהה.
 */

export const INDEX_HTML = 'index.html';
export const CONTENT_JSON = 'content.json';
export const RUNTIME_SCRIPT = 'runtime/app.js';
export const RUNTIME_STYLES = 'runtime/styles.css';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** לטקסט שנכנס לתוכן תגית או לערך מאפיין. הכותרת של הלומדה היא קלט של המשתמש. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * JSON להטמעה בתוך `<script>`.
 *
 * המחרוזת `</script>` בתוך תוכן הלומדה הייתה סוגרת את התגית ושוברת את
 * הקובץ — הפרסר של ה-HTML אינו מבין JSON. אחרי החלפת כל תו `<` ברצף
 * ה-escape המקביל לא נשאר במחרוזת אף `<` שיכול לסגור תגית, ו-`JSON.parse`
 * מחזיר בדיוק את הטקסט המקורי.
 */
export function embedJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** אייקון מוטמע — מונע בקשת favicon.ico שנכשלת ומלכלכת את הקונסולה של הלומד */
function faviconDataUri(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="8" fill="${color}"/>` +
    `<path d="M9 10h6a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H9V10Zm14 0h-6a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h6V10Z" fill="white"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * העיצוב של המסמך עצמו, מחוץ ל-`.lc-course`.
 *
 * מכוון בכוונה למינימום: רקע וצבע טקסט מהערכה, איפוס שוליים, ומצב
 * הטעינה שנראה עד שהחבילה עולה. כל השאר מגיע מ-`runtime/styles.css`.
 */
function documentShellCss(data: EmbeddedCourseData): string {
  const { colors } = data.course.theme;

  return `html, body { margin: 0; padding: 0; }
html { background: ${colors.background}; }
body { min-block-size: 100vh; background: ${colors.background}; color: ${colors.text}; }
#lc-root { min-block-size: 100vh; }
.lc-loading {
  margin: 0;
  padding: 15vh 24px;
  text-align: center;
  font-family: system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif;
  color: ${colors.textMuted};
}`;
}

export interface IndexHtmlOptions {
  /**
   * נתיבים לסקריפטים קלאסיים שנטענים **לפני** חבילת הריצה. משמש להזרקת
   * מתאם ה-SCORM, שחייב לרשום את מאזין `lc:progress` לפני שהלומדה עולה
   * ומתחילה לשדר. ריק בייצוא הרגיל — כך התוצר העצמאי נשאר בדיוק כפי שהיה.
   */
  preRuntimeScripts?: string[];
}

export function buildIndexHtml(data: EmbeddedCourseData, options: IndexHtmlOptions = {}): string {
  const { course } = data;
  const description = course.description || course.subtitle || '';
  // הגופנים נטענים לפני גיליון הלומדה: כך ה-@font-face מוכר כשהכללים שמשתמשים
  // בו נקראים, ואין רגע של טקסט בגופן ברירת המחדל שקופץ אחר כך
  const fontLinks = fontCssPaths(course.theme)
    .map((href) => `    <link rel="stylesheet" href="${href}" />\n`)
    .join('');
  const preRuntime = (options.preRuntimeScripts ?? [])
    .map((src) => `    <script src="${src}"></script>\n`)
    .join('');

  return `<!doctype html>
<html lang="${escapeHtml(course.language)}" dir="${course.direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="generator" content="${escapeHtml(`${APP_NAME} ${APP_VERSION}`)}" />
${description ? `    <meta name="description" content="${escapeHtml(description)}" />\n` : ''}    <link rel="icon" href="${faviconDataUri(course.theme.colors.primary)}" />
    <title>${escapeHtml(course.title)}</title>
${fontLinks}    <link rel="stylesheet" href="${RUNTIME_STYLES}" />
    <style>
${documentShellCss(data)}
    </style>
    <!-- ערכת העיצוב של הלומדה. נכתבת על ידי אותה themeToCssVars שהעורך מזריק,
         ולכן התוצר והתצוגה המקדימה אינם יכולים להיראות שונה. -->
    <style>
${themeToCssVars(course.theme)}
    </style>
  </head>
  <body>
    <!-- נתוני הלומדה. מוטמעים ולא נטענים ב-fetch, כדי שהקובץ יעבוד מ-file:// -->
    <script type="application/json" id="${COURSE_DATA_ELEMENT_ID}">${embedJson(data)}</script>
    <div id="lc-root"><p class="lc-loading">טוען את הלומדה…</p></div>
    <noscript>כדי לצפות בלומדה יש להפעיל JavaScript בדפדפן.</noscript>
${preRuntime}    <!-- סקריפט קלאסי ולא מודול: מודול לא ירוץ בפתיחה ישירה מ-file:// -->
    <script src="${RUNTIME_SCRIPT}"></script>
  </body>
</html>
`;
}
