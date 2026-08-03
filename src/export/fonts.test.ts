import { describe, expect, it } from 'vitest';
import { defaultTheme } from '@/model/themes';
import type { Theme } from '@/model/types';
import { ExportError } from './runtimeBundle';
import { fontCssPath, fontCssPaths, fontFamiliesFor, fontFilesIn, loadFontBundle } from './fonts';

/**
 * הגופן הוא ההבדל בין "הלומדה נראית כמו שתוכננה בכל מחשב" לבין "הלומדה
 * נראית כמו שתוכננה אצל מי שבמקרה מותקן אצלו Heebo". לכן הוא נארז לתוצר,
 * ולכן הבדיקות כאן שומרות על שני הדברים שיכולים להישבר בשקט: הקישור
 * ל-CSS והנתיבים שבתוכו.
 */

const HEEBO_CSS = `@font-face {
  font-family: 'Heebo Variable';
  src: url(heebo-hebrew-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0590-05FF;
}

@font-face {
  font-family: 'Heebo Variable';
  src: url(heebo-latin-wght-normal.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF;
}`;

const RUBIK_CSS = `@font-face {
  font-family: 'Rubik Variable';
  src: url(rubik-hebrew-wght-normal.woff2) format('woff2-variations');
}

@font-face {
  font-family: 'Rubik Variable';
  src: url(rubik-latin-wght-normal.woff2) format('woff2-variations');
}`;

const themeWith = (
  fontFamily: Theme['typography']['fontFamily'],
  headingFamily?: Theme['typography']['headingFamily'],
): Theme => ({
  ...defaultTheme,
  typography: { ...defaultTheme.typography, fontFamily, headingFamily },
});

const respond = (body: string) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob([body])),
  }) as Response;

const fetchOf = (map: Record<string, string>) =>
  ((url: string) => {
    const path = new URL(url).pathname.replace(/^\//, '');
    return path in map
      ? Promise.resolve(respond(map[path]))
      : Promise.reject(new Error('לא נמצא'));
  }) as unknown as typeof fetch;

const bundle = {
  'fonts/heebo.css': HEEBO_CSS,
  'fonts/heebo-hebrew-wght-normal.woff2': 'wOF2-hebrew',
  'fonts/heebo-latin-wght-normal.woff2': 'wOF2-latin',
  'fonts/rubik.css': RUBIK_CSS,
  'fonts/rubik-hebrew-wght-normal.woff2': 'wOF2-rubik-he',
  'fonts/rubik-latin-wght-normal.woff2': 'wOF2-rubik-la',
  'fonts/OFL.txt': 'SIL Open Font License 1.1',
};

const options = { fetchImpl: fetchOf(bundle), baseUrl: 'http://localhost:5173/' };

describe('בחירת הגופן שנארז', () => {
  it('נארזת את משפחת הגוף שהערכה בחרה', () => {
    expect(fontCssPath(themeWith('heebo'))).toBe('fonts/heebo.css');
    expect(fontCssPath(themeWith('rubik'))).toBe('fonts/rubik.css');
    expect(fontCssPaths(themeWith('heebo'))).toEqual(['fonts/heebo.css']);
  });

  it('כשגופן הכותרות שונה — נארזות שתי המשפחות', () => {
    expect(fontFamiliesFor(themeWith('heebo', 'rubik'))).toEqual(['heebo', 'rubik']);
    expect(fontCssPaths(themeWith('heebo', 'rubik'))).toEqual([
      'fonts/heebo.css',
      'fonts/rubik.css',
    ]);
  });

  it('גופן המערכת אינו אורז דבר — אין מה להטמיע', async () => {
    expect(fontCssPath(themeWith('system'))).toBeNull();
    expect(fontCssPaths(themeWith('system'))).toEqual([]);

    const fonts = await loadFontBundle(themeWith('system'), options);

    expect(fonts.stylesheets).toEqual([]);
    expect(fonts.files).toEqual([]);
  });
});

describe('קריאת קובצי הגופן מתוך ה-CSS', () => {
  it('מוצאת את כל קובצי ה-woff2 שהגיליון מפנה אליהם', () => {
    expect(fontFilesIn(HEEBO_CSS)).toEqual([
      'heebo-hebrew-wght-normal.woff2',
      'heebo-latin-wght-normal.woff2',
    ]);
  });

  it('הרשימה נקראת מה-CSS ולא מרשימה קבועה — כך היא לא יכולה להתיישן', () => {
    const renamed = HEEBO_CSS.replace('heebo-hebrew', 'heebo-hebrew-v2');

    expect(fontFilesIn(renamed)).toContain('heebo-hebrew-v2-wght-normal.woff2');
  });
});

describe('טעינת חבילת הגופן לייצוא', () => {
  it('מחזירה את הגיליון, את הקבצים ואת הרישיון', async () => {
    const fonts = await loadFontBundle(themeWith('heebo'), options);

    expect(fonts.stylesheets).toEqual([{ path: 'fonts/heebo.css', content: HEEBO_CSS }]);
    expect(fonts.files.map((file) => file.path)).toEqual([
      'fonts/heebo-hebrew-wght-normal.woff2',
      'fonts/heebo-latin-wght-normal.woff2',
    ]);
    // OFL 1.1 מחייב שהרישיון ילווה את הקבצים בכל הפצה
    expect(fonts.license).toContain('Open Font License');
  });

  it('אורזת גם גופן כותרות נפרד בלי לשכפל קבצים', async () => {
    const fonts = await loadFontBundle(themeWith('heebo', 'rubik'), options);

    expect(fonts.stylesheets.map((sheet) => sheet.path)).toEqual([
      'fonts/heebo.css',
      'fonts/rubik.css',
    ]);
    expect(fonts.files.map((file) => file.path)).toEqual([
      'fonts/heebo-hebrew-wght-normal.woff2',
      'fonts/heebo-latin-wght-normal.woff2',
      'fonts/rubik-hebrew-wght-normal.woff2',
      'fonts/rubik-latin-wght-normal.woff2',
    ]);
  });

  it('עוצרת כשקובץ גופן חסר, במקום לארוז CSS שמפנה לשום מקום', async () => {
    const partial = { ...bundle };
    delete (partial as Record<string, string>)['fonts/heebo-latin-wght-normal.woff2'];

    await expect(
      loadFontBundle(themeWith('heebo'), { ...options, fetchImpl: fetchOf(partial) }),
    ).rejects.toBeInstanceOf(ExportError);
  });

  it('עוצרת על גיליון שאינו מפנה לאף קובץ', async () => {
    await expect(
      loadFontBundle(themeWith('heebo'), {
        ...options,
        fetchImpl: fetchOf({ ...bundle, 'fonts/heebo.css': '/* ריק */' }),
      }),
    ).rejects.toThrow(/woff2/);
  });
});
