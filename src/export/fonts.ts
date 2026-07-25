import type { Theme } from '@/model/types';
import { fetchBundleBlob, fetchBundleFile, type LoadRuntimeOptions } from './runtimeBundle';

/**
 * הגופנים שנארזים לתוך התוצר.
 *
 * לומדה שרצה מ-`file://` בלי אינטרנט אינה יכולה לטעון גופן מ-CDN, וגופן
 * עברי שאינו מותקן אצל הלומד פשוט אינו קיים. לכן קובצי ה-woff2 נוסעים
 * בתוך ה-ZIP, ו-`index.html` מקשר אליהם בנתיב יחסי — אותה מוסכמה שחלה על
 * חבילת ה-runtime ועל הנכסים.
 *
 * **נארזת משפחה אחת בלבד — זו שהערכה בחרה.** אריזת שלוש המשפחות הייתה
 * מוסיפה כ-90KB שאיש לא יראה. "גופן המערכת" אינו אורז דבר.
 *
 * הקבצים מגיעים מ-`public/fonts/` (תוצר `build:fonts`), כלומר הם אותם
 * קבצים בדיוק שהעורך מציג בקנבס.
 */

export const FONTS_DIR = 'fonts';
export const FONT_LICENSE = `${FONTS_DIR}/OFL.txt`;

export interface FontBundle {
  /** ה-CSS עם ה-@font-face, או null כשהערכה משתמשת בגופן המערכת */
  css: { path: string; content: string } | null;
  files: { path: string; blob: Blob }[];
  license: string | null;
}

export const emptyFontBundle: FontBundle = { css: null, files: [], license: null };

/** נתיב גיליון הגופן של הערכה, יחסית לשורש התוצר */
export function fontCssPath(theme: Theme): string | null {
  const family = theme.typography.fontFamily;
  return family === 'system' ? null : `${FONTS_DIR}/${family}.css`;
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
  const cssPath = fontCssPath(theme);
  if (!cssPath) return emptyFontBundle;

  const content = await fetchBundleFile(cssPath, options);
  const fileNames = fontFilesIn(content);

  if (fileNames.length === 0) {
    // CSS בלי קובץ גופן פירושו גיליון פגום; עדיף לעצור מאשר לארוז גופן
    // שלא ייטען ולתת למשתמש לגלות זאת אצל הלומד
    throw new Error(`גיליון הגופנים ${cssPath} אינו מפנה לאף קובץ woff2.`);
  }

  const files = await Promise.all(
    fileNames.map(async (name) => ({
      path: `${FONTS_DIR}/${name}`,
      blob: await fetchBundleBlob(`${FONTS_DIR}/${name}`, options),
    })),
  );

  return {
    css: { path: cssPath, content },
    files,
    // OFL 1.1 מחייב שהרישיון ילווה את קובצי הגופן בכל הפצה, וה-ZIP הזה
    // הוא הפצה לכל דבר
    license: await fetchBundleFile(FONT_LICENSE, options),
  };
}
