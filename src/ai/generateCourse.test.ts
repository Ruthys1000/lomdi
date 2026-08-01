import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCourseFromText } from './generateCourse';

function mockFetch(response: { ok: boolean; status: number; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateCourseFromText', () => {
  it('שולחת את הטקסט ומריצה את הפלט דרך שכבת הקליטה', async () => {
    const rawCourse = {
      title: 'בטיחות',
      chapters: [{ blocks: [{ type: 'richText', content: {} }] }],
    };
    mockFetch({ ok: true, status: 200, body: { course: rawCourse } });

    const result = await generateCourseFromText('תוכן כלשהו');

    expect(fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ method: 'POST' }));
    expect(result.course.title).toBe('בטיחות');
    // refine הוסיף מסך פתיחה — סימן שהפלט עבר את importGeneratedCourse
    expect(result.course.chapters[0].blocks[0].type).toBe('hero');
  });

  it('מרפאת פלט פגום במקום לזרוק', async () => {
    mockFetch({ ok: true, status: 200, body: { course: 'לא אובייקט' } });

    const result = await generateCourseFromText('תוכן');

    expect(result.course.chapters.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('מעבירה הודעת שגיאה מהשרת', async () => {
    mockFetch({ ok: false, status: 422, body: { error: 'הבקשה נדחתה.' } });

    await expect(generateCourseFromText('תוכן')).rejects.toThrow('הבקשה נדחתה.');
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
