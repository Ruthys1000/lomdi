import { describe, expect, it } from 'vitest';
// הלוגיקה מוטמעת ב-`api/generate.ts` כדי שפונקציית ה-serverless תישאר עצמאית
// (Vercel לא כולל קובץ אח ב-slice של הפונקציה בזמן ריצה). הבדיקה מייבאת אותה
// משם דרך נתיב יחסי — ה-import מסוג type של `@vercel/node` נמחק בטרנספילציה,
// ו-`new Anthropic()` חי בתוך ה-handler ולא ברמת המודול, כך שהייבוא בטוח.
import { parseCourseJson } from '../../api/generate';

describe('parseCourseJson', () => {
  it('מפרסרת JSON תקין דרך המסלול המהיר', () => {
    const raw = '{"title":"בטיחות","chapters":[{"title":"פרק"}]}';
    expect(parseCourseJson(raw)).toEqual({ title: 'בטיחות', chapters: [{ title: 'פרק' }] });
  });

  it('מתעלמת מטקסט לפני ואחרי ה-JSON', () => {
    const raw = 'הנה הלומדה:\n{"title":"קורס"}\nבהצלחה!';
    expect(parseCourseJson(raw)).toEqual({ title: 'קורס' });
  });

  it('מפשיטה גדרות קוד markdown', () => {
    const raw = '```json\n{"title":"קורס"}\n```';
    expect(parseCourseJson(raw)).toEqual({ title: 'קורס' });
  });

  it('מתקנת פסיק עודף באובייקט', () => {
    expect(parseCourseJson('{"a":1,"b":2,}')).toEqual({ a: 1, b: 2 });
  });

  it('מתקנת פסיק עודף במערך', () => {
    expect(parseCourseJson('{"items":[1,2,3,]}')).toEqual({ items: [1, 2, 3] });
  });

  it('מטפלת בשורה חדשה גולמית בתוך מחרוזת עברית', () => {
    // מירכאות עם שורת בקרה ממש (\n גולמי) בתוך הערך — JSON.parse קשיח דוחה זאת.
    const raw = '{"title":"שלום\nעולם"}';
    expect(parseCourseJson(raw)).toEqual({ title: 'שלום\nעולם' });
  });

  it('מטפלת בטאב גולמי בתוך מחרוזת', () => {
    const raw = '{"text":"א\tב"}';
    expect(parseCourseJson(raw)).toEqual({ text: 'א\tב' });
  });

  it('סוגרת אובייקט שנקטע באמצע', () => {
    const raw = '{"title":"בטיחות","chapters":[{"title":"פרק"';
    expect(parseCourseJson(raw)).toEqual({ title: 'בטיחות', chapters: [{ title: 'פרק' }] });
  });

  it('סוגרת מחרוזת שנקטעה באמצע', () => {
    const raw = '{"title":"בטיחות בעבו';
    expect(parseCourseJson(raw)).toEqual({ title: 'בטיחות בעבו' });
  });

  it('משלימה null למפתח בלי ערך אחרי קטיעה', () => {
    const raw = '{"title":"קורס","subtitle":';
    expect(parseCourseJson(raw)).toEqual({ title: 'קורס', subtitle: null });
  });

  it('משמיטה מפתח תלוי (בלי נקודתיים) אחרי קטיעה', () => {
    const raw = '{"title":"קורס","subtitle"';
    expect(parseCourseJson(raw)).toEqual({ title: 'קורס' });
  });

  it('מחזירה null כשאין סוגר פותח כלל', () => {
    expect(parseCourseJson('סתם טקסט בלי JSON')).toBeNull();
    expect(parseCourseJson('')).toBeNull();
  });

  it('מחזירה null על זבל בלתי-ניתן-לתיקון', () => {
    expect(parseCourseJson('{"a": @#$ }')).toBeNull();
  });
});
