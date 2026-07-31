import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import { blobBytes } from '@/test/blob';
import type { EmbeddedCourseData } from '@/runtime/readCourseData';
import { buildCourseZip, exportFileName, exportFolderName } from './exportZip';
import { buildExportPayload } from './payload';
import type { RuntimeBundle } from './exportZip';

const runtime: RuntimeBundle = {
  appJs: '/* חבילת הלומדה */ console.log(1);',
  stylesCss: '.lc-course { color: #111; }',
};

const bytes = new Uint8Array([137, 80, 78, 71]);

const asset = (id: string): AssetMeta => ({
  id,
  originalName: 'תמונה של המנכ"ל.png',
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size: 4,
  exportPath: `assets/images/${id}.png`,
});

function courseWithImage(assetId: string) {
  return createCourse({
    title: 'לומדת בטיחות',
    chapters: [
      createChapter({
        title: 'פרק ראשון',
        blocks: [createBlock('image', { content: { ...createBlock('image').content, assetId } })],
      }),
    ],
  });
}

const FOLDER = 'lomdi-2026-07-25';

async function writeZip(payload: EmbeddedCourseData, blobs: Map<string, Blob>) {
  return JSZip.loadAsync(
    await buildCourseZip({
      payload,
      blobs,
      runtime,
      folderName: FOLDER,
      date: new Date('2026-07-25T09:00:00.000Z'),
    }),
  );
}

describe('מבנה ה-ZIP המיוצא', () => {
  it('אורז את כל הקבצים תחת תיקיית שורש אחת', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await writeZip(payload, new Map([['asset-a', new Blob([bytes])]]));

    const paths = Object.keys(zip.files).filter((path) => !zip.files[path].dir);

    expect(paths.sort()).toEqual(
      [
        `${FOLDER}/README.txt`,
        `${FOLDER}/assets/images/asset-a.png`,
        `${FOLDER}/content.json`,
        `${FOLDER}/index.html`,
        `${FOLDER}/runtime/app.js`,
        `${FOLDER}/runtime/styles.css`,
      ].sort(),
    );
  });

  it('אורז את הנכס בדיוק לפי exportPath, עם הבתים המקוריים', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await writeZip(
      payload,
      new Map([['asset-a', new Blob([bytes], { type: 'image/png' })]]),
    );

    const entry = zip.file(`${FOLDER}/assets/images/asset-a.png`);
    expect(entry).not.toBeNull();
    expect(new Uint8Array(await entry!.async('uint8array'))).toEqual(bytes);
  });

  it('כותב את חבילת הלומדה כפי שהתקבלה, בלי לגעת בה', async () => {
    const payload = buildExportPayload(createCourse(), []);
    const zip = await writeZip(payload, new Map());

    expect(await zip.file(`${FOLDER}/runtime/app.js`)!.async('string')).toBe(runtime.appJs);
    expect(await zip.file(`${FOLDER}/runtime/styles.css`)!.async('string')).toBe(runtime.stylesCss);
  });

  it('כותב content.json זהה לנתונים המוטמעים ב-index.html', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await writeZip(payload, new Map([['asset-a', new Blob([bytes])]]));

    const content = JSON.parse(await zip.file(`${FOLDER}/content.json`)!.async('string'));
    const html = await zip.file(`${FOLDER}/index.html`)!.async('string');
    const embedded = JSON.parse(
      /id="lc-course-data">(.*?)<\/script>/s.exec(html)![1].replace(/\\u003c/g, '<'),
    );

    expect(content).toEqual(embedded);
  });

  it('אינו מכיל כתובות blob — הבלוקים שומרים assetId בלבד', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await writeZip(payload, new Map([['asset-a', new Blob([bytes])]]));

    const html = await zip.file(`${FOLDER}/index.html`)!.async('string');
    const json = await zip.file(`${FOLDER}/content.json`)!.async('string');

    expect(html).not.toContain('blob:');
    expect(json).not.toContain('blob:');
  });

  it('מוסיף README בעברית עם BOM, כדי ש-Notepad לא יציג ג׳יבריש', async () => {
    const payload = buildExportPayload(createCourse({ title: 'לומדת בטיחות' }), []);
    const zip = await writeZip(payload, new Map());

    const readme = await zip.file(`${FOLDER}/README.txt`)!.async('string');

    expect(readme.charCodeAt(0)).toBe(0xfeff);
    expect(readme).toContain('index.html');
    expect(readme).toContain('לומדת בטיחות');
  });
});

describe('הגופן בארכיון', () => {
  const fonts = {
    css: { path: 'fonts/heebo.css', content: '@font-face { src: url(heebo-hebrew.woff2); }' },
    files: [{ path: 'fonts/heebo-hebrew.woff2', blob: new Blob([bytes]) }],
    license: 'SIL Open Font License 1.1',
  };

  it('אורז את הגיליון, את הקבצים ואת הרישיון תחת fonts/', async () => {
    const payload = buildExportPayload(createCourse(), []);
    const zip = await JSZip.loadAsync(
      await buildCourseZip({ payload, blobs: new Map(), runtime, fonts, folderName: FOLDER }),
    );

    expect(zip.file(`${FOLDER}/fonts/heebo.css`)).not.toBeNull();
    expect(zip.file(`${FOLDER}/fonts/heebo-hebrew.woff2`)).not.toBeNull();
    // OFL 1.1 מחייב שהרישיון ילווה את קובצי הגופן בכל הפצה
    expect(zip.file(`${FOLDER}/fonts/OFL.txt`)).not.toBeNull();
  });

  it('בלי גופן (גופן המערכת) אין בכלל תיקיית fonts', async () => {
    const payload = buildExportPayload(createCourse(), []);
    const zip = await writeZip(payload, new Map());

    expect(Object.keys(zip.files).some((path) => path.includes('fonts/'))).toBe(false);
  });
});

describe('סינון הנכסים לתוצר', () => {
  it('אינו אורז נכס שאף בלוק אינו מפנה אליו', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [
      asset('asset-a'),
      asset('asset-unused'),
    ]);

    const zip = await writeZip(
      payload,
      new Map([
        ['asset-a', new Blob([bytes])],
        ['asset-unused', new Blob([bytes])],
      ]),
    );

    expect(zip.file(`${FOLDER}/assets/images/asset-a.png`)).not.toBeNull();
    expect(zip.file(`${FOLDER}/assets/images/asset-unused.png`)).toBeNull();
  });

  it('אינו רושם נכס שלא נארז ברשימה המוטמעת — נתיב לקובץ חסר הוא תמונה שבורה', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [
      asset('asset-a'),
      asset('asset-unused'),
    ]);

    expect(payload.assets.map((item) => item.id)).toEqual(['asset-a']);
  });
});

describe('שם הקובץ ושם התיקייה', () => {
  const day = new Date('2026-07-25T09:00:00.000Z');

  it('הם ASCII ונגזרים מאותה נוסחה של קובץ הפרויקט', () => {
    // כותרת עברית-בלבד מקבלת מבדיל hash קצר (ASCII) במקום slug ריק
    expect(exportFileName('לומדת בטיחות', day)).toMatch(/^lomdi-[0-9a-z]{4}-2026-07-25\.zip$/);
    expect(exportFolderName('לומדת בטיחות', day)).toMatch(/^lomdi-[0-9a-z]{4}-2026-07-25$/);
    expect(exportFileName('Safety 101 — מבוא', day)).toBe('lomdi-Safety-101-2026-07-25.zip');
  });

  it('כותרות עבריות שונות אינן דורסות זו את זו, ואותה כותרת יציבה', () => {
    expect(exportFileName('לומדת בטיחות', day)).not.toBe(exportFileName('לומדת קליטה', day));
    expect(exportFileName('לומדת בטיחות', day)).toBe(exportFileName('לומדת בטיחות', day));
  });

  it('שם התיקייה הוא שם הקובץ בלי הסיומת', () => {
    const title = 'Safety 101';
    expect(`${exportFolderName(title, day)}.zip`).toBe(exportFileName(title, day));
    // גם לכותרת עברית-בלבד — ה-hash זהה בשני השמות
    const hebrew = 'לומדת בטיחות';
    expect(`${exportFolderName(hebrew, day)}.zip`).toBe(exportFileName(hebrew, day));
  });
});

describe('בתי הנכסים', () => {
  it('הבלוב מגיע לארכיון בלי המרה', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const blob = new Blob([bytes], { type: 'image/png' });
    const zip = await writeZip(payload, new Map([['asset-a', blob]]));

    const entry = await zip.file(`${FOLDER}/assets/images/asset-a.png`)!.async('blob');
    expect(await blobBytes(entry)).toEqual(bytes);
  });
});
