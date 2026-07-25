import { RUNTIME_SCRIPT, RUNTIME_STYLES } from './indexHtml';
import type { RuntimeBundle } from './exportZip';

/**
 * שליפת חבילת הלומדה שנארזת לתוצר.
 *
 * `public/runtime/` הוא תוצר build ואינו נשמר בגיט: `npm run build` בונה
 * אותו לפני העורך, `npm run predev` בפיתוח. אם מישהו הריץ `vite build`
 * לבדו, החבילה פשוט אינה שם — והכשל היה מתגלה רק אחרי הורדת ZIP ופריקתו,
 * כלומר אצל המשתמש. לכן שני המצבים נבדקים כאן ועוצרים את הייצוא:
 *
 * - הקובץ חסר או ריק
 * - התקבל HTML במקום הקובץ (שרת שמחזיר את index.html של העורך לכל נתיב)
 *
 * הכתובות יחסיות ל-`document.baseURI` ולא מוחלטות, כדי שהעורך יעבוד גם
 * כשהוא מוגש מתת-נתיב.
 */

export class ExportError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

export interface LoadRuntimeOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

const missingBundle = (path: string, cause?: unknown) =>
  new ExportError(
    `חבילת הלומדה (${path}) לא נמצאה, ולכן אי אפשר לייצא. public/runtime/ הוא תוצר build — יש להריץ npm run build ולטעון מחדש.`,
    cause,
  );

async function fetchBundleFile(path: string, options: LoadRuntimeOptions): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? document.baseURI;

  let text: string;
  try {
    const response = await fetchImpl(new URL(path, baseUrl).href);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    text = await response.text();
  } catch (error) {
    throw missingBundle(path, error);
  }

  // דף השגיאה של שרת פיתוח מגיע עם 200 ונראה כמו קובץ תקין עד שהוא
  // נטען בדפדפן של הלומד
  if (!text.trim() || text.trimStart().startsWith('<')) throw missingBundle(path);

  return text;
}

export async function loadRuntimeBundle(options: LoadRuntimeOptions = {}): Promise<RuntimeBundle> {
  const [appJs, stylesCss] = await Promise.all([
    fetchBundleFile(RUNTIME_SCRIPT, options),
    fetchBundleFile(RUNTIME_STYLES, options),
  ]);

  return { appJs, stylesCss };
}
