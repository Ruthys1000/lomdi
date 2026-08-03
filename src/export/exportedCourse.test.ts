// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';
import { JSDOM, VirtualConsole } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import { defaultNavigation } from '@/model/defaults';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import { buildCourseZip, type RuntimeBundle } from './exportZip';
import { fontFilesIn, type FontBundle } from './fonts';
import { buildExportPayload } from './payload';

/**
 * הבדיקה המהותית של שלב 7.
 *
 * היא מייצרת ZIP אמיתי — עם חבילת ה-runtime **הבנויה**, לא עם מחרוזת
 * מדומה — פורקת אותו לתיקייה זמנית ופותחת את `index.html` מ-`file://`,
 * בדיוק כמו משתמש שפרק את הארכיון ולחץ פעמיים. זה התרחיש שכל
 * הארכיטקטורה קיימת בשבילו, ואי אפשר לאמת אותו בבדיקת יחידה על מחרוזת:
 * נתיב שנראה תקין ומצביע לקובץ שלא נארז נראה בדיוק כמו נתיב עובד.
 *
 * דורשת `npm run build:runtime` (רץ אוטומטית ב-pretest).
 */

const BUNDLE_DIR = 'public/runtime';
const FONTS_DIR = 'public/fonts';

const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

const imageAsset: AssetMeta = {
  id: 'asset-a1b2c3d4e5',
  originalName: 'תמונה של המנכ"ל.png',
  safeName: 'asset-a1b2c3d4e5.png',
  kind: 'image',
  mimeType: 'image/png',
  size: png.byteLength,
  exportPath: 'assets/images/asset-a1b2c3d4e5.png',
};

let runtime: RuntimeBundle;
let fonts: FontBundle;

beforeAll(() => {
  try {
    runtime = {
      appJs: readFileSync(join(BUNDLE_DIR, 'app.js'), 'utf8'),
      stylesCss: readFileSync(join(BUNDLE_DIR, 'styles.css'), 'utf8'),
    };
  } catch {
    throw new Error(`לא נמצאה חבילת ה-runtime ב-${BUNDLE_DIR}. הרץ תחילה: npm run build:runtime`);
  }

  // הגופן של ברירת המחדל, מתוך תוצר build:fonts האמיתי — כדי שהבדיקה
  // תארוז את אותם קבצים שהמשתמש מקבל
  try {
    const css = readFileSync(join(FONTS_DIR, 'heebo.css'), 'utf8');
    fonts = {
      stylesheets: [{ path: 'fonts/heebo.css', content: css }],
      files: fontFilesIn(css).map((name) => ({
        path: `fonts/${name}`,
        // Uint8Array ולא Blob, מאותה סיבה כמו התמונה למטה
        blob: readFileSync(join(FONTS_DIR, name)) as unknown as Blob,
      })),
      license: readFileSync(join(FONTS_DIR, 'OFL.txt'), 'utf8'),
    };
  } catch {
    throw new Error(`לא נמצאה חבילת הגופנים ב-${FONTS_DIR}. הרץ תחילה: npm run build:fonts`);
  }
});

function course() {
  return createCourse({
    title: 'איך בונים הדרכה דיגיטלית אפקטיבית',
    // גלילה רציפה, כדי שהבדיקה תראה את שני הפרקים בלי לנווט ביניהם
    navigation: { ...defaultNavigation, mode: 'scroll' },
    chapters: [
      createChapter({
        title: 'פתיחה',
        blocks: [
          createBlock('richText'),
          createBlock('image', {
            content: { ...createBlock('image').content, assetId: imageAsset.id, alt: 'תרשים' },
          }),
        ],
      }),
      createChapter({ title: 'עקרונות מנחים', blocks: [createBlock('quiz')] }),
    ],
  });
}

/** פורק את ה-ZIP לתיקייה זמנית ומחזיר את הנתיב לתיקיית השורש שבתוכו */
async function exportAndExtract(): Promise<string> {
  const payload = buildExportPayload(course(), [imageAsset]);
  const folderName = 'lomdi-test-course';

  const zip = await buildCourseZip({
    payload,
    // הבתים נמסרים כ-Uint8Array ולא כ-Blob: JSZip קורא Blob דרך FileReader,
    // שאינו קיים בסביבת node. הבתים שנכתבים לארכיון זהים, והמסלול של Blob
    // עצמו נבדק ב-exportZip.test.ts שרץ ב-jsdom.
    blobs: new Map([[imageAsset.id, png as unknown as Blob]]),
    runtime,
    fonts,
    folderName,
  });

  const archive = await JSZip.loadAsync(Buffer.from(await zip.arrayBuffer()));
  const target = mkdtempSync(join(tmpdir(), 'lomdi-export-'));

  for (const [path, entry] of Object.entries(archive.files)) {
    const full = join(target, path);
    if (entry.dir) {
      mkdirSync(full, { recursive: true });
      continue;
    }
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, Buffer.from(await entry.async('uint8array')));
  }

  return join(target, folderName);
}

interface OpenedCourse {
  document: Document;
  messages: string[];
  dir: string;
}

/**
 * פותח את `index.html` שנפרק, מ-`file://` ובלי שרת.
 *
 * `resources: 'usable'` הוא העיקר: בלעדיו JSDOM לא היה טוען את
 * `runtime/app.js` מהדיסק, והבדיקה הייתה מאמתת מחרוזת HTML במקום לומדה
 * שרצה.
 */
async function openExported(dir: string): Promise<OpenedCourse> {
  const messages: string[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('error', (m) => messages.push(`error: ${m}`));
  virtualConsole.on('warn', (m) => messages.push(`warn: ${m}`));
  virtualConsole.on('jsdomError', (e: Error) => messages.push(`jsdomError: ${e.message}`));

  const indexPath = join(dir, 'index.html');
  const dom = new JSDOM(readFileSync(indexPath, 'utf8'), {
    url: pathToFileURL(indexPath).href,
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole,
  });

  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    document: dom.window.document,
    dir,
    // מנוע ה-CSS של JSDOM ישן מה-CSS שהלומדה שולחת, והוא מדווח על כללים
    // שאינו מבין. זו הודעה על הפרסר של סביבת הבדיקה ולא על התוצר.
    messages: messages.filter((message) => !message.includes('Could not parse CSS stylesheet')),
  };
}

describe('הלומדה המיוצאת נפתחת מ-file:// בלי שרת', () => {
  let opened: OpenedCourse;

  beforeAll(async () => {
    opened = await openExported(await exportAndExtract());
  }, 30_000);

  it('עולה בלי שגיאות בקונסולה', () => {
    expect(opened.messages).toEqual([]);
  });

  it('מרנדרת את הלומדה ואת שני הפרקים', () => {
    expect(opened.document.querySelector('.lc-course')).not.toBeNull();
    expect(opened.document.querySelectorAll('.lc-chapter')).toHaveLength(2);
  });

  it('כותבת את הכותרת, השפה וכיוון הכתיבה למסמך', () => {
    expect(opened.document.title).toBe('איך בונים הדרכה דיגיטלית אפקטיבית');
    expect(opened.document.documentElement.dir).toBe('rtl');
    expect(opened.document.documentElement.lang).toBe('he');
  });

  it('מציגה תמונה מנתיב יחסי שהקובץ שלו באמת נארז', () => {
    const img = opened.document.querySelector('img');
    expect(img).not.toBeNull();

    const src = img!.getAttribute('src');
    expect(src).toBe(imageAsset.exportPath);
    expect(src).not.toContain('blob:');
    expect(existsSync(join(opened.dir, src!))).toBe(true);
  });

  it('מרנדרת בלוק אינטראקטיבי — שאלת הבחירה מגיעה עם התשובות ועם כפתור', () => {
    const quiz = opened.document.querySelector('.lc-quiz');
    expect(quiz).not.toBeNull();
    expect(quiz!.querySelectorAll('input[type="radio"]').length).toBeGreaterThan(0);
    expect(quiz!.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('אורזת את חבילת הלומדה ואת גיליון הסגנון לצד ה-HTML', () => {
    expect(existsSync(join(opened.dir, 'runtime/app.js'))).toBe(true);
    expect(existsSync(join(opened.dir, 'runtime/styles.css'))).toBe(true);
    expect(readFileSync(join(opened.dir, 'runtime/styles.css'), 'utf8')).toContain('.lc-course');
  });

  /**
   * גופן שאינו מותקן אצל הלומד פשוט אינו קיים, ו-CDN אינו זמין מ-file://.
   * לכן קובצי ה-woff2 חייבים להיות בארכיון, וכל קובץ שה-CSS מפנה אליו
   * חייב להימצא בפועל — קישור לקובץ חסר נראה בדיוק כמו גופן שעובד, עד
   * שפותחים את הלומדה במחשב אחר.
   */
  it('אורזת את הגופן שהערכה בחרה, כולל כל קובץ שהגיליון מפנה אליו', () => {
    const cssPath = join(opened.dir, 'fonts/heebo.css');
    expect(existsSync(cssPath)).toBe(true);

    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain('Heebo Variable');
    expect(fontFilesIn(css).length).toBeGreaterThan(0);

    for (const file of fontFilesIn(css)) {
      expect(existsSync(join(opened.dir, 'fonts', file))).toBe(true);
    }

    // OFL 1.1 מחייב שהרישיון ילווה את קובצי הגופן בכל הפצה
    expect(existsSync(join(opened.dir, 'fonts/OFL.txt'))).toBe(true);
  });

  it('ה-HTML מקשר לגופן בנתיב יחסי, לפני גיליון הלומדה', () => {
    const html = readFileSync(join(opened.dir, 'index.html'), 'utf8');

    expect(html).toContain('<link rel="stylesheet" href="fonts/heebo.css" />');
    expect(html.indexOf('fonts/heebo.css')).toBeLessThan(html.indexOf('runtime/styles.css'));
  });

  it('אינה מפנה לשום כתובת מוחלטת בקובץ ה-HTML', () => {
    const html = readFileSync(join(opened.dir, 'index.html'), 'utf8');

    expect(html).not.toContain('blob:');
    expect(html).not.toContain('localhost');
    expect(html).not.toMatch(/(src|href)="\/\w/);
  });
});
