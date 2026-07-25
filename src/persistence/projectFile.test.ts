import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import { SCHEMA_VERSION } from '@/model/types';
import { blobBytes } from '@/test/blob';
import {
  COURSE_JSON,
  buildProjectFile,
  projectFileName,
  readProjectZip,
  writeProjectZip,
} from './projectFile';

const asset = (id: string): AssetMeta => ({
  id,
  originalName: 'תמונה של המנכ"ל.png',
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size: 4,
  exportPath: `assets/images/${id}.png`,
});

const bytes = new Uint8Array([137, 80, 78, 71]);

function courseWithImage(assetId: string) {
  return createCourse({
    title: 'לומדת בטיחות',
    chapters: [
      createChapter({
        title: 'פרק ראשון',
        blocks: [
          createBlock('image', { content: { ...createBlock('image').content, assetId } }),
        ],
      }),
    ],
  });
}

describe('כתיבת קובץ פרויקט', () => {
  it('כותבת את course.json ואת הנכסים לפי exportPath', async () => {
    const project = buildProjectFile(courseWithImage('asset-a'), [asset('asset-a')]);
    const blobs = new Map([['asset-a', new Blob([bytes], { type: 'image/png' })]]);

    const zip = await JSZip.loadAsync(await writeProjectZip(project, blobs));

    expect(zip.file(COURSE_JSON)).not.toBeNull();
    expect(zip.file('assets/images/asset-a.png')).not.toBeNull();
  });

  it('אינה כותבת כתובות blob לקובץ — הבלוקים שומרים assetId בלבד', async () => {
    const project = buildProjectFile(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await JSZip.loadAsync(
      await writeProjectZip(project, new Map([['asset-a', new Blob([bytes])]])),
    );

    const json = await zip.file(COURSE_JSON)!.async('string');

    expect(json).not.toContain('blob:');
    expect(json).not.toContain('localhost');
    expect(json).toContain('asset-a');
  });

  it('שומרת גם כשהבלוב של נכס חסר, במקום לחסום את המשתמש', async () => {
    const project = buildProjectFile(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await JSZip.loadAsync(await writeProjectZip(project, new Map()));

    expect(zip.file(COURSE_JSON)).not.toBeNull();
    expect(zip.file('assets/images/asset-a.png')).toBeNull();
  });

  it('רושמת את גרסת הסכמה ואת פרטי המחולל', () => {
    const project = buildProjectFile(createCourse(), []);

    expect(project.version).toBe(SCHEMA_VERSION);
    expect(project.generator.name).toBe('LearnIt');
    expect(Date.parse(project.savedAt)).not.toBeNaN();
  });
});

describe('קריאת קובץ פרויקט', () => {
  it('הלוך-חזור מלא, כולל בתי הנכס', async () => {
    const course = courseWithImage('asset-a');
    const project = buildProjectFile(course, [asset('asset-a')]);
    const zip = await writeProjectZip(
      project,
      new Map([['asset-a', new Blob([bytes], { type: 'image/png' })]]),
    );

    const result = await readProjectZip(zip);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.project.course.title).toBe('לומדת בטיחות');
    expect(result.project.course.chapters[0].blocks[0].content.assetId).toBe('asset-a');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].meta.originalName).toBe('תמונה של המנכ"ל.png');
    expect(await blobBytes(result.assets[0].blob)).toEqual(bytes);
    expect(result.warnings).toEqual([]);
  });

  it('מדלגת על נכס שקובצו חסר, ומדווחת עליו כאזהרה ולא כשגיאה', async () => {
    const project = buildProjectFile(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await writeProjectZip(project, new Map());

    const result = await readProjectZip(zip);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.assets).toHaveLength(0);
    expect(result.project.assets).toHaveLength(0);
    expect(result.warnings[0]).toContain('תמונה של המנכ"ל.png');
  });

  it('דוחה קובץ שאינו ארכיון', async () => {
    const result = await readProjectZip(new Blob(['לא ZIP בכלל']));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('ארכיון תקין');
  });

  it('דוחה ארכיון בלי course.json', async () => {
    const zip = new JSZip();
    zip.file('readme.txt', 'שלום');

    const result = await readProjectZip(await zip.generateAsync({ type: 'blob' }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain(COURSE_JSON);
  });

  it('דוחה course.json פגום', async () => {
    const zip = new JSZip();
    zip.file(COURSE_JSON, '{ זה לא JSON');

    const result = await readProjectZip(await zip.generateAsync({ type: 'blob' }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('פגום');
  });

  it('דוחה מסמך שאינו עומד בסכמה, עם הודעה בעברית', async () => {
    const zip = new JSZip();
    zip.file(
      COURSE_JSON,
      JSON.stringify({
        version: SCHEMA_VERSION,
        generator: { name: 'LearnIt', version: '0.1.0' },
        savedAt: new Date().toISOString(),
        course: { ...createCourse(), language: '' },
        assets: [],
      }),
    );

    const result = await readProjectZip(await zip.generateAsync({ type: 'blob' }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('course.language');
  });

  it('דוחה קובץ שנשמר בגרסה חדשה מדי', async () => {
    const zip = new JSZip();
    zip.file(
      COURSE_JSON,
      JSON.stringify({ ...buildProjectFile(createCourse(), []), version: '99.0' }),
    );

    const result = await readProjectZip(await zip.generateAsync({ type: 'blob' }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('99.0');
  });
});

describe('שם קובץ ההורדה', () => {
  const day = new Date('2026-07-25T09:00:00.000Z');

  it('הוא ASCII בלבד — Chromium מוריד קובץ בשם download בלי סיומת אחרת', () => {
    const name = projectFileName('לומדת בטיחות', day);

    expect(name).toBe('learnit-2026-07-25.course.zip');
    // הבדיקה המהותית: הסיומת שורדת, ולכן אפשר לפתוח את הקובץ בחזרה
    expect(name).toMatch(/^[ -~]+$/);
    expect(name.endsWith('.course.zip')).toBe(true);
  });

  it('שומר את החלק הלטיני של הכותרת, כדי שהקובץ עדיין יהיה מזוהה', () => {
    expect(projectFileName('Safety 101 — מבוא', day)).toBe(
      'learnit-Safety-101-2026-07-25.course.zip',
    );
  });

  it('מסיר תווים שמערכות קבצים אוסרות', () => {
    expect(projectFileName('Rules: part 1/2', day)).toBe('learnit-Rules-part-1-2-2026-07-25.course.zip');
  });

  it('נופל לשם עם תאריך בלבד כשהכותרת ריקה', () => {
    expect(projectFileName('   ', day)).toBe('learnit-2026-07-25.course.zip');
  });
});
