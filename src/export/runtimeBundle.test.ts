import { describe, expect, it } from 'vitest';
import { ExportError, loadRuntimeBundle } from './runtimeBundle';

/**
 * הכשל שהבדיקות האלה מונעות: `public/runtime/` אינו בגיט, ולכן פריסה
 * שהריצה `vite build` בלבד מגישה עורך שנראה תקין ומייצר ZIP עם לומדה
 * ריקה — תקלה שמתגלה רק אחרי פריקת הארכיון אצל המשתמש.
 */

const BASE = 'http://localhost:5173/';

const respond = (body: string, ok = true, status = 200) =>
  ({ ok, status, text: () => Promise.resolve(body) }) as Response;

const fetchOf = (map: Record<string, Response>) => {
  return ((url: string) => {
    const path = new URL(url).pathname.replace(/^\//, '');
    const response = map[path];
    return response ? Promise.resolve(response) : Promise.reject(new Error('לא נמצא'));
  }) as unknown as typeof fetch;
};

const bundle = {
  'runtime/app.js': respond('(function(){ /* לומדה */ })();'),
  'runtime/styles.css': respond('.lc-course { color: #111; }'),
};

describe('טעינת חבילת הלומדה לייצוא', () => {
  it('מחזירה את שני הקבצים', async () => {
    const runtime = await loadRuntimeBundle({ fetchImpl: fetchOf(bundle), baseUrl: BASE });

    expect(runtime.appJs).toContain('function');
    expect(runtime.stylesCss).toContain('.lc-course');
  });

  it('פונה לנתיב יחסי לכתובת העורך, כדי לעבוד גם מתת-נתיב', async () => {
    const requested: string[] = [];
    const fetchImpl = ((url: string) => {
      requested.push(url);
      return Promise.resolve(respond('x'));
    }) as unknown as typeof fetch;

    await loadRuntimeBundle({ fetchImpl, baseUrl: 'https://example.com/studio/' });

    expect(requested.sort()).toEqual([
      'https://example.com/studio/runtime/app.js',
      'https://example.com/studio/runtime/styles.css',
    ]);
  });

  it('עוצרת עם הודעה שמפנה ל-npm run build כשהקובץ חסר', async () => {
    const failing = fetchOf({ 'runtime/styles.css': bundle['runtime/styles.css'] });

    await expect(loadRuntimeBundle({ fetchImpl: failing, baseUrl: BASE })).rejects.toThrow(
      /npm run build/,
    );
  });

  it('עוצרת גם על 404 שמגיע כתשובה תקינה', async () => {
    const notFound = fetchOf({ ...bundle, 'runtime/app.js': respond('Not Found', false, 404) });

    await expect(loadRuntimeBundle({ fetchImpl: notFound, baseUrl: BASE })).rejects.toBeInstanceOf(
      ExportError,
    );
  });

  it('עוצרת כשמתקבל HTML במקום החבילה — שרת שמחזיר index.html לכל נתיב', async () => {
    const spa = fetchOf({ ...bundle, 'runtime/app.js': respond('<!doctype html><html></html>') });

    await expect(loadRuntimeBundle({ fetchImpl: spa, baseUrl: BASE })).rejects.toThrow(
      /חבילת הלומדה/,
    );
  });

  it('עוצרת על קובץ ריק', async () => {
    const empty = fetchOf({ ...bundle, 'runtime/styles.css': respond('   ') });

    await expect(loadRuntimeBundle({ fetchImpl: empty, baseUrl: BASE })).rejects.toBeInstanceOf(
      ExportError,
    );
  });
});
