import { RUNTIME_SCRIPT, RUNTIME_STYLES } from './indexHtml';
import type { RuntimeBundle } from './exportZip';

/**
 * שליפת חבילת הלומדה שנארזת לתוצר.
 *
 * `public/runtime/` ו-`public/fonts/` הם תוצרי build ואינם נשמרים בגיט:
 * `npm run build` בונה אותם לפני העורך, `npm run predev` בפיתוח. אם מישהו
 * הריץ `vite build` לבדו, החבילה פשוט אינה שם — והכשל היה מתגלה רק אחרי
 * הורדת ZIP ופריקתו, כלומר אצל המשתמש. לכן שני המצבים נבדקים כאן ועוצרים
 * את הייצוא:
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
    `הקובץ ${path} חסר בחבילת המחולל, ולכן אי אפשר לייצא. public/runtime/ ו-public/fonts/ הם תוצרי build — יש להריץ npm run build ולטעון מחדש.`,
    cause,
  );

async function fetchBundleResponse(path: string, options: LoadRuntimeOptions): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? document.baseURI;

  try {
    const response = await fetchImpl(new URL(path, baseUrl).href);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (error) {
    throw missingBundle(path, error);
  }
}

/**
 * שליפת קובץ טקסט מתוך תוצרי ה-build שב-`public/`.
 *
 * מיוצא כדי שגם חבילת הגופנים (`export/fonts.ts`) תעבור דרך אותו שומר:
 * אותו כשל, אותה הודעה, ואין שני מסלולים שיכולים להתפצל.
 */
export async function fetchBundleFile(path: string, options: LoadRuntimeOptions): Promise<string> {
  const text = await (await fetchBundleResponse(path, options)).text();

  // דף השגיאה של שרת פיתוח מגיע עם 200 ונראה כמו קובץ תקין עד שהוא
  // נטען בדפדפן של הלומד
  if (!text.trim() || text.trimStart().startsWith('<')) throw missingBundle(path);

  return text;
}

/** אותו שומר, לקבצים בינאריים — קובצי הגופן */
export async function fetchBundleBlob(path: string, options: LoadRuntimeOptions): Promise<Blob> {
  const blob = await (await fetchBundleResponse(path, options)).blob();

  if (blob.size === 0) throw missingBundle(path);

  return blob;
}

export async function loadRuntimeBundle(options: LoadRuntimeOptions = {}): Promise<RuntimeBundle> {
  const [appJs, stylesCss] = await Promise.all([
    fetchBundleFile(RUNTIME_SCRIPT, options),
    fetchBundleFile(RUNTIME_STYLES, options),
  ]);

  return { appJs, stylesCss };
}
