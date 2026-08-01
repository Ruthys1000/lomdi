import { describe, expect, it } from 'vitest';
import { generateImage } from '../../api/generate-image';

/**
 * בדיקות לפונקציית היצירה של `/api/generate-image`. שומרות על אותו חוזה כשל-רך
 * של `searchPexels`: מיפוי סטטוסים (401/429) להודעות מובחנות, נפילה רכה כשה-fetch
 * זורק, וקריאה תקינה של כתובת התמונה מתשובת Recraft.
 */

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function fakeFetch(factories: (() => Response | Error)[]): {
  fetchImpl: typeof fetch;
  urls: string[];
  bodies: string[];
} {
  const urls: string[] = [];
  const bodies: string[] = [];
  let call = 0;
  const fetchImpl = ((input: unknown, init?: { body?: unknown }): Promise<Response> => {
    urls.push(String(input));
    if (init?.body) bodies.push(String(init.body));
    const make = factories[Math.min(call, factories.length - 1)];
    call += 1;
    const next = make();
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  }) as unknown as typeof fetch;
  return { fetchImpl, urls, bodies };
}

describe('generateImage', () => {
  it('מחזירה את כתובת התמונה שיצר הספק', async () => {
    const { fetchImpl, urls, bodies } = fakeFetch([
      () => jsonResponse({ data: [{ url: 'https://recraft/out.png' }] }),
    ]);

    const result = await generateImage('a friendly office, flat illustration', 'key', fetchImpl);

    expect(result).toEqual({ ok: true, url: 'https://recraft/out.png' });
    expect(urls[0]).toContain('recraft.ai');
    expect(bodies[0]).toContain('recraftv3');
    expect(bodies[0]).toContain('a friendly office');
  });

  it('ממפה 401 להודעת מפתח שגוי', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({}, 401)]);

    const result = await generateImage('x', 'bad-key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'מפתח Recraft שגוי או חסר הרשאה.' });
  });

  it('ממפה 429 לחריגת מכסה', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({}, 429)]);

    const result = await generateImage('x', 'key', fetchImpl);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.error).toContain('מכסת Recraft');
    }
  });

  it('נופלת רך כשה-fetch עצמו זורק', async () => {
    const { fetchImpl } = fakeFetch([() => new Error('network down')]);

    const result = await generateImage('x', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'ספק התמונות אינו זמין כרגע.' });
  });

  it('מחזירה שגיאה כשהתשובה תקינה אך בלי תמונה', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({ data: [] })]);

    const result = await generateImage('x', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'הספק לא החזיר תמונה.' });
  });
});
