import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler, { generationModelParams } from '../../api/generate';

/**
 * בדיקות ברמת ההנדלר ל-`/api/generate` — האזור השברירי ביותר בקוד, שעד היום
 * נבדק רק דרך ה-helper הטהור `parseCourseJson`. כאן ה-Anthropic SDK ממוקק כדי
 * לתסרט תשובות מודל, ובמיוחד לאמת את **הניסיון החוזר**: תשובה פגומה בניסיון
 * הראשון ותקינה בשני חייבת להסתיים בהצלחה בלי פעולת משתמש.
 *
 * הבדיקה חיה תחת `src/` (ולא ליד ה-endpoint) כי glob ה-include של Vitest הוא
 * `src/**` — בדיוק כמו `generateImageEndpoint.test.ts` ו-`repairJson.test.ts`.
 */

// מצב משותף עם ה-mock של ה-SDK. vi.hoisted מבטיח שהוא מאותחל לפני שה-factory של
// vi.mock (המוגבה מעל ה-import) נוגע בו.
const sdk = vi.hoisted(() => ({
  /** תור התשובות שכל קריאה ל-stream() תחזיר, לפי הסדר (message או Error). */
  scripted: [] as unknown[],
  /** כמה פעמים נפתח stream — מודד את מספר הניסיונות בפועל. */
  streamCalls: 0,
  /** ארגומנטים אחרונים שנשלחו ל-stream — לבדיקת פרמטרי המודל. */
  lastStreamArgs: null as Record<string, unknown> | null,
}));

vi.mock('@anthropic-ai/sdk', () => {
  class FakeAnthropic {
    messages = {
      stream: (args: Record<string, unknown>) => {
        sdk.streamCalls += 1;
        sdk.lastStreamArgs = args;
        const next = sdk.scripted.shift();
        return {
          finalMessage: async () => {
            if (next instanceof Error) throw next;
            if (next === undefined) throw new Error('no scripted message');
            return next;
          },
          abort: () => {},
        };
      },
    };
  }
  return { default: FakeAnthropic };
});

/** message של המודל: בלוקי טקסט + סיבת עצירה, כפי ש-extractCourseJson מצפה. */
const textMessage = (text: string, stopReason = 'end_turn'): unknown => ({
  content: [{ type: 'text', text }],
  stop_reason: stopReason,
});

/** דחיית בטיחות — בלי תוכן, עם stop_reason 'refusal'. */
const refusalMessage = (): unknown => ({ content: [], stop_reason: 'refusal' });

const postRequest = (text: string, format?: string): VercelRequest =>
  ({ method: 'POST', body: { text, format } }) as unknown as VercelRequest;

/** res מזויף שאוסף כותרות, סטטוס, גוף JSON, ושורות ה-NDJSON שנכתבו. */
function createResponse() {
  const writes: string[] = [];
  const res = {
    statusCode: 0,
    jsonBody: undefined as unknown,
    headers: {} as Record<string, string | number>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.jsonBody = body;
      return res;
    },
    setHeader(key: string, value: string | number) {
      res.headers[key] = value;
    },
    flushHeaders() {},
    write(chunk: string) {
      writes.push(chunk);
      return true;
    },
    on() {
      return res;
    },
    end() {},
    /** שורות ה-NDJSON שנכתבו, מפורסרות לאובייקטים. */
    lines(): { type?: string; [key: string]: unknown }[] {
      return writes
        .join('')
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as { type?: string });
    },
  };
  return res;
}

const runHandler = async (req: VercelRequest) => {
  const res = createResponse();
  await handler(req, res as unknown as VercelResponse);
  return res;
};

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  sdk.scripted = [];
  sdk.streamCalls = 0;
  sdk.lastStreamArgs = null;
  process.env.ANTHROPIC_API_KEY = 'test-key';
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
});

describe('api/generate handler', () => {
  it('מזרים תוצאה כשהמודל מחזיר JSON תקין בניסיון הראשון', async () => {
    sdk.scripted = [textMessage('{"title":"בטיחות","chapters":[]}')];

    const res = await runHandler(postRequest('תוכן כלשהו'));

    const lines = res.lines();
    expect(lines.some((line) => line.type === 'progress')).toBe(true);
    expect(lines.find((line) => line.type === 'result')?.course).toEqual({
      title: 'בטיחות',
      chapters: [],
    });
    expect(sdk.streamCalls).toBe(1);
  });

  it('מנסה שוב פעם אחת ומצליח כשהניסיון הראשון פגום והשני תקין', async () => {
    sdk.scripted = [
      textMessage('בלי JSON כאן בכלל'),
      textMessage('{"title":"קורס","chapters":[]}'),
    ];

    const res = await runHandler(postRequest('תוכן'));

    const lines = res.lines();
    expect(lines.find((line) => line.type === 'result')?.course).toEqual({
      title: 'קורס',
      chapters: [],
    });
    expect(lines.some((line) => line.type === 'progress' && line.stage === 'retrying')).toBe(true);
    expect(sdk.streamCalls).toBe(2);
  });

  it('מסמנת את דופק ההתחלה כ-stage started', async () => {
    sdk.scripted = [textMessage('{"title":"בטיחות","chapters":[]}')];

    const res = await runHandler(postRequest('תוכן'));

    expect(res.lines().some((line) => line.type === 'progress' && line.stage === 'started')).toBe(
      true,
    );
  });

  it('מחזיר הודעת דחייה כששני הניסיונות נדחו על ידי הבטיחות', async () => {
    sdk.scripted = [refusalMessage(), refusalMessage()];

    const res = await runHandler(postRequest('תוכן'));

    expect(res.lines().find((line) => line.type === 'error')?.error).toContain('נדחתה');
    expect(sdk.streamCalls).toBe(2);
  });

  it('מחזיר הודעת "ארוך מדי" כשהתשובה נקטעה מ-max_tokens ולא ניתנת לתיקון', async () => {
    sdk.scripted = [
      textMessage('{"a": @#$', 'max_tokens'),
      textMessage('{"a": @#$', 'max_tokens'),
    ];

    const res = await runHandler(postRequest('תוכן'));

    expect(res.lines().find((line) => line.type === 'error')?.error).toContain('ארוכה מדי');
  });

  it('נופל להודעה הגנרית כששני הניסיונות פגומים ולא נקטעו', async () => {
    sdk.scripted = [textMessage('זבל בלי סוגריים'), textMessage('עוד זבל')];

    const res = await runHandler(postRequest('תוכן'));

    expect(res.lines().find((line) => line.type === 'error')?.error).toContain(
      'לא החזיר JSON תקין',
    );
    expect(sdk.streamCalls).toBe(2);
  });

  it('מחזיר 500 כשמפתח ה-API חסר, בלי לפתוח stream', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const res = await runHandler(postRequest('תוכן'));

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody).toEqual({ error: 'מפתח ה-AI לא הוגדר בשרת.' });
    expect(sdk.streamCalls).toBe(0);
  });

  it('מחזיר 405 על מתודה שאינה POST', async () => {
    const res = await runHandler({ method: 'GET' } as unknown as VercelRequest);

    expect(res.statusCode).toBe(405);
    expect(sdk.streamCalls).toBe(0);
  });

  it('מחזיר 400 כשלא הוזן טקסט', async () => {
    const res = await runHandler(postRequest(''));

    expect(res.statusCode).toBe(400);
    expect(sdk.streamCalls).toBe(0);
  });

  it('מחזיר 413 כשהטקסט חורג מהמגבלה', async () => {
    const res = await runHandler(postRequest('א'.repeat(20_001)));

    expect(res.statusCode).toBe(413);
    expect(sdk.streamCalls).toBe(0);
  });

  it('שולח thinking מבוטל לפורמט מובנה (checklist)', async () => {
    sdk.scripted = [textMessage('{"title":"בדיקה","chapters":[]}')];

    await runHandler(postRequest('תוכן', 'checklist'));

    expect(sdk.lastStreamArgs?.thinking).toEqual({ type: 'disabled' });
    expect(sdk.lastStreamArgs?.model).toBe('claude-opus-5');
  });

  it('שולח thinking adaptive עם effort נמוך לפורמט נרטיבי (scenario)', async () => {
    sdk.scripted = [textMessage('{"title":"תרחיש","chapters":[]}')];

    await runHandler(postRequest('תוכן', 'scenario'));

    expect(sdk.lastStreamArgs?.thinking).toEqual({ type: 'adaptive' });
    expect(sdk.lastStreamArgs?.output_config).toEqual({ effort: 'low' });
  });
});

describe('generationModelParams', () => {
  it('מבטל thinking בפורמטים מובנים', () => {
    for (const format of ['onePager', 'process', 'checklist', 'challenge']) {
      expect(generationModelParams(format).thinking).toEqual({ type: 'disabled' });
      expect(generationModelParams(format).model).toBe('claude-opus-5');
    }
  });

  it('משאיר thinking adaptive עם effort נמוך לתרחיש/חקר מקרה/גנרי', () => {
    for (const format of ['scenario', 'caseStudy', undefined]) {
      const params = generationModelParams(format);
      expect(params.thinking).toEqual({ type: 'adaptive' });
      expect(params.output_config).toEqual({ effort: 'low' });
    }
  });
});
