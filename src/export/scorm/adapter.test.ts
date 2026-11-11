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

const win = window as unknown as { API?: MockApi; __LC_RESUME__?: unknown };

afterEach(() => {
  // pagehide מסיים את ההפעלה של המתאם מהבדיקה הקודמת, כדי שהמאזין שלו
  // לא ימשיך לכתוב ל-API של הבדיקה הבאה
  window.dispatchEvent(new Event('pagehide'));
  delete win.API;
  delete win.__LC_RESUME__;
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

  it('שומר את מצב הלומד ואת המיקום ב-LMS', () => {
    win.API = makeApi();
    eval(scormAdapterJs());

    const state = { chapterId: 'ch-b', blockState: { 'block-1': ['item-1'] } };
    window.dispatchEvent(
      new CustomEvent('lc:progress', { detail: { completed: false, location: '1', state } }),
    );

    expect(win.API.store['cmi.core.lesson_location']).toBe('1');
    expect(JSON.parse(win.API.store['cmi.suspend_data'])).toEqual(state);
  });

  it('מזריק ללומדה את המצב שנשמר ב-LMS בהפעלה קודמת', () => {
    win.API = makeApi();
    win.API.store['cmi.suspend_data'] = JSON.stringify({ chapterId: 'ch-b' });
    eval(scormAdapterJs());

    expect(win.__LC_RESUME__).toEqual({ chapterId: 'ch-b' });
  });

  it('מזריק אובייקט ריק כשאין מצב קודם או כשהוא פגום', () => {
    win.API = makeApi();
    win.API.store['cmi.suspend_data'] = '{not json';
    eval(scormAdapterJs());

    expect(win.__LC_RESUME__).toEqual({});
  });

  it('מוותר על מצב הבלוקים כשהמצב המלא חורג ממגבלת suspend_data', () => {
    win.API = makeApi();
    eval(scormAdapterJs());

    const state = { chapterId: 'ch-b', blockState: { big: 'x'.repeat(5000) } };
    window.dispatchEvent(new CustomEvent('lc:progress', { detail: { completed: false, state } }));

    const saved = win.API.store['cmi.suspend_data'];
    expect(saved.length).toBeLessThanOrEqual(4000);
    expect(JSON.parse(saved)).toEqual({ chapterId: 'ch-b' });
  });

  it('אינו מוריד סטטוס completed בחזרה ל-incomplete בכניסה חוזרת', () => {
    win.API = makeApi();
    win.API.store['cmi.core.lesson_status'] = 'completed';
    eval(scormAdapterJs());

    window.dispatchEvent(new CustomEvent('lc:progress', { detail: { completed: false } }));

    expect(win.API.store['cmi.core.lesson_status']).toBe('completed');
  });

  it('מסיים את ההפעלה עם exit=suspend כדי שה-LMS ישמור את המצב', () => {
    win.API = makeApi();
    eval(scormAdapterJs());

    window.dispatchEvent(new Event('pagehide'));

    expect(win.API.store['cmi.core.exit']).toBe('suspend');
    expect(win.API.calls).toContain('finish');
  });

  it('מדווח passed או failed כשהוגדר ציון מעבר', () => {
    win.API = makeApi();
    eval(scormAdapterJs());

    window.dispatchEvent(
      new CustomEvent('lc:progress', { detail: { completed: true, score: 60, passScore: 70 } }),
    );
    expect(win.API.store['cmi.core.lesson_status']).toBe('failed');

    // ניסיון חוזר שמשפר את הציון מעדכן את הסטטוס
    window.dispatchEvent(
      new CustomEvent('lc:progress', { detail: { completed: true, score: 80, passScore: 70 } }),
    );
    expect(win.API.store['cmi.core.lesson_status']).toBe('passed');
  });
});
