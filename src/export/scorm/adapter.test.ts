import { afterEach, describe, expect, it } from 'vitest';
import { scormAdapterJs } from './adapter';

/**
 * המתאם רץ בתוך ה-iframe של SCORM ומדבר מול API שה-LMS מזריק. הבדיקות
 * מריצות אותו מול stub של API 1.2 ומוודאות שהוא מאתחל, מדווח ציון וסטטוס
 * מאירוע `lc:progress`, ולא נופל כשאין LMS (פתיחה עצמאית מ-file://).
 */

interface MockApi {
  store: Record<string, string>;
  calls: string[];
  LMSInitialize: (s: string) => string;
  LMSFinish: (s: string) => string;
  LMSGetValue: (key: string) => string;
  LMSSetValue: (key: string, value: string) => string;
  LMSCommit: (s: string) => string;
  LMSGetLastError: () => string;
}

function makeApi(): MockApi {
  const store: Record<string, string> = {};
  const calls: string[] = [];
  return {
    store,
    calls,
    LMSInitialize: () => (calls.push('init'), 'true'),
    LMSFinish: () => (calls.push('finish'), 'true'),
    LMSGetValue: (key) => store[key] ?? '',
    LMSSetValue: (key, value) => ((store[key] = value), calls.push(`set:${key}`), 'true'),
    LMSCommit: () => (calls.push('commit'), 'true'),
    LMSGetLastError: () => '0',
  };
}

const win = window as unknown as { API?: MockApi };

afterEach(() => {
  delete win.API;
});

describe('scormAdapter', () => {
  it('מאתחל את ההפעלה ומסמן incomplete בטעינה', () => {
    win.API = makeApi();
    eval(scormAdapterJs());

    expect(win.API.calls).toContain('init');
    expect(win.API.store['cmi.core.lesson_status']).toBe('incomplete');
  });

  it('מדווח ציון וסטטוס completed מאירוע lc:progress', () => {
    win.API = makeApi();
    eval(scormAdapterJs());

    window.dispatchEvent(new CustomEvent('lc:progress', { detail: { completed: true, score: 80 } }));

    expect(win.API.store['cmi.core.score.raw']).toBe('80');
    expect(win.API.store['cmi.core.score.max']).toBe('100');
    expect(win.API.store['cmi.core.lesson_status']).toBe('completed');
    expect(win.API.calls).toContain('commit');
  });

  it('אינו נופל כשאין API של LMS (פתיחה עצמאית)', () => {
    expect(win.API).toBeUndefined();
    expect(() => eval(scormAdapterJs())).not.toThrow();
  });
});
