import { describe, expect, it } from 'vitest';
import { searchPexels } from '../../api/image';

/**
 * בדיקות לפונקציית החיפוש של `/api/image`. הן שומרות על שתי ההתנהגויות
 * שהוקשחו: חיפוש חוזר בלי אילוץ אוריינטציה כשאין תוצאה, ומיפוי סטטוסים
 * של Pexels (401/429) להודעות מובחנות שיעלו עד ה-toast של המשתמש.
 */

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const photo = (large: string) => ({ src: { large } });

/**
 * בונה fetch מזויף שמחזיר תגובות לפי הסדר ורושם את הכתובות שנקראו.
 * מקבל *מפעלים* ולא תגובות מוכנות: גוף Response ניתן לקריאה פעם אחת בלבד,
 * ולכן כל קריאה חייבת לקבל אובייקט טרי (חשוב לחיפוש החוזר).
 */
function fakeFetch(factories: (() => Response | Error)[]): { fetchImpl: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  let call = 0;
  const fetchImpl = ((input: unknown): Promise<Response> => {
    urls.push(String(input));
    const make = factories[Math.min(call, factories.length - 1)];
    call += 1;
    const next = make();
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  }) as unknown as typeof fetch;
  return { fetchImpl, urls };
}

describe('searchPexels', () => {
  it('מחזירה את כתובת הצילום הראשון בחיפוש מוצלח', async () => {
    const { fetchImpl, urls } = fakeFetch([() => jsonResponse({ photos: [photo('https://img/a.jpg')] })]);

    const result = await searchPexels('office team', 'key', fetchImpl);

    expect(result).toEqual({ ok: true, url: 'https://img/a.jpg' });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('orientation=landscape');
  });

  it('מנסה שוב בלי אילוץ אוריינטציה כשהחיפוש הראשון ריק', async () => {
    const { fetchImpl, urls } = fakeFetch([
      () => jsonResponse({ photos: [] }),
      () => jsonResponse({ photos: [photo('https://img/broad.jpg')] }),
    ]);

    const result = await searchPexels('rare topic', 'key', fetchImpl);

    expect(result).toEqual({ ok: true, url: 'https://img/broad.jpg' });
    expect(urls).toHaveLength(2);
    expect(urls[1]).not.toContain('orientation');
  });

  it('ממפה 401 להודעת מפתח שגוי, בלי ניסיון חוזר', async () => {
    const { fetchImpl, urls } = fakeFetch([() => jsonResponse({}, 401)]);

    const result = await searchPexels('anything', 'bad-key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'מפתח Pexels שגוי או חסר הרשאה.' });
    expect(urls).toHaveLength(1);
  });

  it('ממפה 429 לחריגת מכסה', async () => {
    const { fetchImpl } = fakeFetch([() => jsonResponse({}, 429)]);

    const result = await searchPexels('anything', 'key', fetchImpl);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.error).toContain('מכסת Pexels');
    }
  });

  it('מחזירה 404 כששני החיפושים ריקים', async () => {
    const { fetchImpl, urls } = fakeFetch([() => jsonResponse({ photos: [] })]);

    const result = await searchPexels('nothing', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 404, error: 'לא נמצאה תמונה מתאימה.' });
    expect(urls).toHaveLength(2);
  });

  it('נופלת רך כשה-fetch עצמו זורק', async () => {
    const { fetchImpl } = fakeFetch([() => new Error('network down')]);

    const result = await searchPexels('x', 'key', fetchImpl);

    expect(result).toEqual({ ok: false, status: 502, error: 'ספק התמונות אינו זמין כרגע.' });
  });
});
