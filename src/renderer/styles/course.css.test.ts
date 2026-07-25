// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * course.css חי בשתי סביבות שונות מאוד: בעורך הוא נטען לתוך מסמך
 * שה-preflight של Tailwind כבר אתחל בו את כל האלמנטים, ובתוצר המיוצא
 * הוא לבד במסמך ריק שבו חלות ברירות המחדל של הדפדפן.
 *
 * כל מאפיין שנשען על ברירת מחדל של הדפדפן ייראה שונה בשתי הסביבות. זה
 * כבר קרה: רשימות תבליטים הופיעו בייצוא ונעלמו בעורך, כי Tailwind מאפס
 * list-style ו-course.css לא הצהיר עליו.
 *
 * הבדיקה הזו נועלת את המאפיינים שהתגלו כרגישים.
 */

const css = readFileSync('src/renderer/styles/course.css', 'utf8');

/** ההערות מוסרות מראש: הן מכילות פסיקים ותווים שמבלבלים את פירוק הבוררים */
const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * מאחדת את כל ההצהרות שחלות על בורר נתון.
 *
 * בורר יכול להופיע בכמה כללים, וגם כאחד מכמה בוררים באותו כלל
 * (`.lc-prose ul, .lc-prose ol { … }`). התאמה לכלל הראשון בלבד הייתה
 * מחמיצה הצהרות ומדווחת על כישלון שגוי.
 */
function ruleBody(selector: string): string {
  const rules = cssWithoutComments.matchAll(/([^{}]+)\{([^}]*)\}/g);
  const bodies: string[] = [];

  for (const [, selectorList, body] of rules) {
    const selectors = selectorList.split(',').map((part) => part.trim().replace(/\s+/g, ' '));

    if (selectors.includes(selector)) bodies.push(body);
  }

  return bodies.join('\n');
}

describe('course.css אינו נשען על ברירות מחדל של הסביבה', () => {
  it('מצהיר על list-style לרשימות', () => {
    expect(ruleBody('.lc-prose ul')).toMatch(/list-style:\s*disc/);
    expect(ruleBody('.lc-prose ol')).toMatch(/list-style:\s*decimal/);
  });

  it('מצהיר על display: list-item לפריטי רשימה', () => {
    expect(ruleBody('.lc-prose li')).toMatch(/display:\s*list-item/);
  });

  it('מאפס box-sizing בתוך הלומדה במקום להניח border-box', () => {
    expect(ruleBody('.lc-course *')).toMatch(/box-sizing:\s*border-box/);
  });

  it('מגדיר משפחת גופן וגודל בסיס במפורש', () => {
    const root = ruleBody('.lc-course');
    expect(root).toMatch(/font-family:\s*var\(--lc-font-family\)/);
    expect(root).toMatch(/font-size:\s*var\(--lc-font-size-base\)/);
  });
});

describe('course.css מתאים גם ל-RTL וגם ל-LTR', () => {
  it('אינו משתמש במאפייני מיקום פיזיים שאינם מתהפכים', () => {
    // margin-left/right ו-padding-left/right לא מתהפכים לפי dir, ולכן
    // היו דורשים כלל נפרד לכל כיוון. המקבילות הלוגיות עושות זאת לבד.
    const physical = css.match(/^\s*(margin|padding)-(left|right):/gm) ?? [];
    expect(physical).toEqual([]);
  });

  it('אינו משתמש ב-left/right למיקום מוחלט', () => {
    const physical = css.match(/^\s*(left|right):/gm) ?? [];
    expect(physical).toEqual([]);
  });

  it('משתמש ב-text-align לוגי בלבד', () => {
    const physical = css.match(/text-align:\s*(left|right)\b/g) ?? [];
    expect(physical).toEqual([]);
  });
});
