import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCourseFromText } from './generateCourse';

/** בונה גוף תגובה מוזרם של שורות NDJSON, כמו שה-endpoint מחזיר בפועל. */
function ndjsonBody(lines: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
      controller.close();
    },
  });
}

/** תגובת הצלחה מוזרמת — פעימת התקדמות ואז שורת התוצאה. */
function mockStream(lines: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, body: ndjsonBody(lines) })),
  );
}

/** תגובת שגיאה — נכשלת לפני הסטרימינג ומוחזרת כ-JSON עם קוד סטטוס. */
function mockError(response: { status: number; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: false,
      status: response.status,
      body: null,
      json: async () => response.body,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateCourseFromText', () => {
  it('קוראת את ה-stream, מדווחת התקדמות ומריצה את הפלט דרך שכבת הקליטה', async () => {
    const rawCourse = {
      title: 'בטיחות',
      chapters: [{ blocks: [{ type: 'richText', content: {} }] }],
    };
    mockStream([{ type: 'progress' }, { type: 'result', course: rawCourse }]);
    const onProgress = vi.fn();

    const result = await generateCourseFromText('תוכן כלשהו', { onProgress });

    expect(fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ method: 'POST' }));
    expect(onProgress).toHaveBeenCalled();
    expect(result.course.title).toBe('בטיחות');
    // refine הוסיף מסך פתיחה — סימן שהפלט עבר את importGeneratedCourse
    expect(result.course.chapters[0].blocks[0].type).toBe('hero');
  });

  it('מרפאת פלט פגום במקום לזרוק', async () => {
    mockStream([{ type: 'result', course: 'לא אובייקט' }]);

    const result = await generateCourseFromText('תוכן');

    expect(result.course.chapters.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('זורקת כשמגיעה שורת error מהזרם', async () => {
    mockStream([{ type: 'error', error: 'הבקשה נדחתה.' }]);

    await expect(generateCourseFromText('תוכן')).rejects.toThrow('הבקשה נדחתה.');
  });

  it('מעבירה הודעת שגיאה מהשרת כשהאימות נכשל לפני הסטרימינג', async () => {
    mockError({ status: 422, body: { error: 'הטקסט ארוך מדי.' } });

    await expect(generateCourseFromText('תוכן')).rejects.toThrow('הטקסט ארוך מדי.');
  });

  it('נופלת להודעה גנרית כשאין גוף JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('not json');
        },
      })),
    );

    await expect(generateCourseFromText('תוכן')).rejects.toThrow('500');
  });
});
