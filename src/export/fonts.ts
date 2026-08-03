import type { FontFamilyId, Theme } from '@/model/types';
import { fetchBundleBlob, fetchBundleFile, type LoadRuntimeOptions } from './runtimeBundle';

/**
 * הגופנים שנארזים לתוך התוצר.
 *
 * לומדה שרצה מ-`file://` בלי אינטרנט אינה יכולה לטעון גופן מ-CDN, וגופן
 * עברי שאינו מותקן אצל הלומד פשוט אינו קיים. לכן קובצי ה-woff2 נוסעים
 * בתוך ה-ZIP, ו-`index.html` מקשר אליהם בנתיב יחסי — אותה מוסכמה שחלה על
 * חבילת ה-runtime ועל הנכסים.
 *
 * נארזות כל המשפחות שהערכה באמת משתמשת בהן (גוף + כותרות אם שונות).
 * "גופן המערכת" אינו אורז דבר.
 *
 * הקבצים מגיעים מ-`public/fonts/` (תוצר `build:fonts`), כלומר הם אותם
 * קבצים בדיוק שהעורך מציג בקנבס.
 */

export const FONTS_DIR = 'fonts';
export const FONT_LICENSE = `${FONTS_DIR}/OFL.txt`;

export interface FontBundle {
  /** גיליונות @font-face — אחד לכל משפחה שנבחרה (גוף / כותרות) */
  stylesheets: { path: string; content: string }[];
  files: { path: string; blob: Blob }[];
  license: string | null;
}

export const emptyFontBundle: FontBundle = { stylesheets: [], files: [], license: null };

/** משפחות הגופן שהערכה צריכה לארוז (בלי system) */
export function fontFamiliesFor(theme: Theme): FontFamilyId[] {
  const families: FontFamilyId[] = [];
  const add = (family: FontFamilyId | undefined) => {
    if (!family || family === 'system') return;
    if (!families.includes(family)) families.push(family);
  };
  add(theme.typography.fontFamily);
  add(theme.typography.headingFamily);
  return families;
}

/** נתיבי גיליונות הגופן של הערכה, יחסית לשורש התוצר */
export function fontCssPaths(theme: Theme): string[] {
  return fontFamiliesFor(theme).map((family) => `${FONTS_DIR}/${family}.css`);
}

/**
 * @deprecated השתמשו ב-`fontCssPaths` — ערכה יכולה לדרוש יותר ממשפחה אחת.
 * נשמר לתאימות בדיקות ישנות: מחזיר את הגיליון הראשון או null.
 */
export function fontCssPath(theme: Theme): string | null {
  return fontCssPaths(theme)[0] ?? null;
}

/**
 * שמות קובצי ה-woff2 שה-CSS מפנה אליהם.
 *
 * נקראים מתוך ה-CSS עצמו ולא מרשימה קבועה: `scripts/build-fonts.mjs`
 * מייצר את שני הקבצים משמות של @fontsource, ורשימה כפולה כאן הייתה
 * מתיישנת בשקט ברגע שהחבילה תשנה שם קובץ — והתוצר היה יוצא עם CSS
 * שמפנה לקובץ שלא נארז.
 */
export function fontFilesIn(css: string): string[] {
  return [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map((match) => match[1].trim());
}

export async function loadFontBundle(
  theme: Theme,
  options: LoadRuntimeOptions = {},
): Promise<FontBundle> {
  const paths = fontCssPaths(theme);
  if (paths.length === 0) return emptyFontBundle;

  const stylesheets: FontBundle['stylesheets'] = [];
  const filesByPath = new Map<string, Blob>();

  for (const cssPath of paths) {
    const content = await fetchBundleFile(cssPath, options);
    const fileNames = fontFilesIn(content);

    if (fileNames.length === 0) {
      // CSS בלי קובץ גופן פירושו גיליון פגום; עדיף לעצור מאשר לארוז גופן
      // שלא ייטען ולתת למשתמש לגלות זאת אצל הלומד
      throw new Error(`גיליון הגופנים ${cssPath} אינו מפנה לאף קובץ woff2.`);
    }

    stylesheets.push({ path: cssPath, content });

    for (const name of fileNames) {
      const path = `${FONTS_DIR}/${name}`;
      if (filesByPath.has(path)) continue;
      filesByPath.set(path, await fetchBundleBlob(path, options));
    }
  }

  return {
    stylesheets,
    files: [...filesByPath.entries()].map(([path, blob]) => ({ path, blob })),
    // OFL 1.1 מחייב שהרישיון ילווה את קובצי הגופן בכל הפצה, וה-ZIP הזה
    // הוא הפצה לכל דבר
    license: await fetchBundleFile(FONT_LICENSE, options),
  };
}
