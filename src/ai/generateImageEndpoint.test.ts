import { describe, expect, it } from 'vitest';
import { generateImage, generateImageWithGemini } from '../../api/generate-image';

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

/**
 * בדיקות לספק Gemini. חוזה הכשל זהה ל-Recraft (מיפוי סטטוסים להודעות מובחנות,
 * נפילה רכה כשה-fetch זורק), אבל תשובת ההצלחה שונה: Gemini מטמיע את התמונה
 * כ-base64 בגוף התשובה, ולכן הפונקציה מחזירה בייטים מפוענחים ולא URL.
 */
describe('generateImageWithGemini', () => {
  const geminiOk = (base64: string, mimeType = 'image/png'): Response =>
    jsonResponse({ candidates: [{ content: { parts: [{ inlineData: { data: base64, mimeType } }] } }] });

  it('מחזירה את בייטי התמונה שהמודל הטמיע כ-base64', async () => {
    const base64 = Buffer.from('PNGDATA').toString('base64');
    const { fetchImpl, urls, bodies } = fakeFetch([() => geminiOk(base64)]);

    const result = await generateImageWithGemini(
      'a friendly office',
      'key',
      fetchImpl,
      'gemini-2.5-flash-image',
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe('image/png');
      expect(result.data.toString()).toBe('PNGDATA');
    }
    expect(urls[0]).toContain('generativelanguage.googleapis.com');
    expect(urls[0]).toContain('gemini-2.5-flash-image');
    expect(bodies[0]).toContain('a friendly office');
    expect(bodies[0]).toContain('responseModalities');
  });

  it('ממפה 400 (מפתח לא תקין) להודעת מפתח שגוי/חסר הרשאה', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({}, 400)]);

    const result = await generateImageWithGemini('x', 'bad-key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'מפתח Gemini שגוי או חסר הרשאה.' });
  });

  it('ממפה 403 (הרשאה חסרה) להודעת מפתח שגוי/חסר הרשאה', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({}, 403)]);

    const result = await generateImageWithGemini('x', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'מפתח Gemini שגוי או חסר הרשאה.' });
  });

  it('ממפה 429 לחריגת מכסה', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({}, 429)]);

    const result = await generateImageWithGemini('x', 'key', fetchImpl);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.error).toContain('מכסת Gemini');
    }
  });

  it('נופלת רך כשה-fetch עצמו זורק', async () => {
    const { fetchImpl } = fakeFetch([() => new Error('network down')]);

    const result = await generateImageWithGemini('x', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'ספק התמונות אינו זמין כרגע.' });
  });

  it('מחזירה שגיאה כשהתשובה תקינה אך בלי חלק תמונה', async () => {
    const { fetchImpl } = fakeFetch([
      () => jsonResponse({ candidates: [{ content: { parts: [{ text: 'אין תמונה' }] } }] }),
    ]);

    const result = await generateImageWithGemini('x', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'הספק לא החזיר תמונה.' });
  });
});
