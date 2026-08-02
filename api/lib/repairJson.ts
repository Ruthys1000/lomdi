/**
 * חילוץ וריפוי של ה-JSON שהמודל מחזיר — הצד השרתי של יצירת הלומדה.
 *
 * המודל אמור להחזיר JSON טהור, אבל בפועל הוא נכשל בשתי דרכים נפוצות שבוללן
 * `JSON.parse` קשיח נופל:
 *   1. **קטיעה** — לומדה גדולה מגיעה לתקרת ה-tokens וה-JSON נחתך באמצע, בלי
 *      הסוגרים הסוגרים (`stop_reason: 'max_tokens'`).
 *   2. **פגמים קלים** — תווי בקרה לא-escaped (שורה חדשה גולמית בתוך מחרוזת
 *      עברית), פסיקים עודפים (`{"a":1,}`).
 *
 * הפילוסופיה זהה לזו של שכבת הריפוי בצד הלקוח (`coerceGeneratedCourse`): במקום
 * לדחות פלט לא-מושלם, לרפא אותו ל-JSON *פרסבילי* — גם אם חלקי — ולתת ל-coerce
 * להשלים את המבנה. כאן מטפלים רק ברמת התחביר; המבנה מטופל בלקוח.
 *
 * **המודול טהור לחלוטין וללא שום import** — כדי שפונקציית ה-serverless תוכל
 * לייבא אותו כאח יחסי בלי לגרור את גרף האפליקציה או את ה-alias `@/`, ששוברים
 * את ה-bundler של Vercel.
 */

/**
 * מחלץ את אובייקט הלומדה מטקסט התשובה של המודל. מנסה קודם פרסור קשיח (המסלול
 * המקורי, אפס סיכון לקלט תקין), ורק אם הוא נכשל מפעיל ריפוי סלחני. מחזיר את
 * האובייקט המפורסר, או `null` אם אי אפשר להפיק JSON פרסבילי.
 */
export function parseCourseJson(rawText: string): unknown | null {
  const text = stripCodeFences(rawText.trim());

  const start = text.indexOf('{');
  if (start === -1) return null;

  // מסלול מהיר: זהה בייט-לבייט להתנהגות המקורית — חיתוך מהסוגר הראשון עד האחרון
  // ופרסור קשיח. קלט תקין נפתר כאן ולעולם לא נוגע בשכבת הריפוי.
  const end = text.lastIndexOf('}');
  if (end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // נופלים לריפוי
    }
  }

  // מסלול ריפוי: לוקחים עד סוף המחרוזת (JSON קטוע נמשך עד הסוף, לא עד `}` אחרון),
  // מתקנים תווי בקרה, פסיקים עודפים וקטיעה, ומנסים שוב.
  try {
    return JSON.parse(repair(text.slice(start)));
  } catch {
    return null;
  }
}

/** מסיר גדרות markdown עוטפות (```json ... ```) אם המודל הוסיף אותן למרות ההנחיה. */
function stripCodeFences(text: string): string {
  const fenced = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text);
  return fenced ? fenced[1].trim() : text;
}

/**
 * סורק את המחרוזת שמאל-לימין ומחזיר JSON פרסבילי. מטפל בתווי בקרה לא-escaped,
 * בפסיקים עודפים לפני סוגר, ובקטיעה — סוגר מחרוזות ומבנים פתוחים בסוף.
 *
 * מגבלה ידועה: קטיעה באמצע ליטרל בוליאני/null/מספר חלקי (`{"a":tru`) עדיין
 * תיכשל בפרסור ותיפול ל-`null` — מקרה נדיר שההודעה הברורה יותר מכסה.
 */
function repair(input: string): string {
  const stack: string[] = []; // הסוגרים הצפויים: '}' או ']'
  let out = '';
  let inString = false;
  let escaped = false;

  for (const char of input) {
    if (inString) {
      if (escaped) {
        out += char;
        escaped = false;
      } else if (char === '\\') {
        out += char;
        escaped = true;
      } else if (char === '"') {
        out += char;
        inString = false;
      } else if (char.charCodeAt(0) < 0x20) {
        out += escapeControlChar(char);
      } else {
        out += char;
      }
      continue;
    }

    if (char === '"') {
      out += char;
      inString = true;
    } else if (char === '{') {
      stack.push('}');
      out += char;
    } else if (char === '[') {
      stack.push(']');
      out += char;
    } else if (char === '}' || char === ']') {
      out = dropTrailingComma(out);
      out += char;
      stack.pop();
    } else {
      out += char;
    }
  }

  // ── סגירת קטיעה ──
  if (escaped) out = out.slice(0, -1); // backslash תלוי בסוף
  if (inString) out += '"'; // מחרוזת שנחתכה באמצע

  out = resolveDanglingTail(out, stack);

  // סוגרים את כל המבנים שנשארו פתוחים, מבפנים החוצה.
  while (stack.length > 0) {
    out = dropTrailingComma(out);
    out += stack.pop();
  }

  return out;
}

/** מחזיר את הצורה ה-escaped של תו בקרה לשיבוץ חוקי בתוך מחרוזת JSON. */
function escapeControlChar(char: string): string {
  switch (char) {
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\t':
      return '\\t';
    case '\b':
      return '\\b';
    case '\f':
      return '\\f';
    default:
      return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  }
}

/** מסיר פסיק עודף (ורווחים אחריו) מסוף המחרוזת שנצברה — למשל לפני `}` או `]`. */
function dropTrailingComma(out: string): string {
  const trimmed = out.replace(/\s+$/, '');
  return trimmed.endsWith(',') ? trimmed.slice(0, -1) : out;
}

/**
 * מיישב זנב חלקי שנשאר אחרי קטיעה, לפני שסוגרים את המבנים:
 *  - פסיק עודף בסוף → מוסר;
 *  - `:` ללא ערך (מפתח בלי value) → משלים `null`;
 *  - מפתח מחרוזת תלוי בתוך אובייקט (מחרוזת במיקום מפתח, בלי `:` אחריה) → מסיר את
 *    הטוקן ואת הפסיק שלפניו. מחרוזת שקדם לה `:` היא *ערך* שלם — משאירים אותה.
 */
function resolveDanglingTail(out: string, stack: string[]): string {
  let result = out.replace(/\s+$/, '');
  if (result.endsWith(',')) result = result.slice(0, -1).replace(/\s+$/, '');

  if (result.endsWith(':')) {
    return `${result} null`;
  }

  // מפתח תלוי: המבנה הנוכחי אובייקט, הזנב מחרוזת שהושלמה, ולפני ה-`"` הפותח שלה
  // עומד `{` או `,` (מיקום מפתח). אם עומד שם `:` — זהו ערך, ולא נוגעים בו.
  if (stack[stack.length - 1] === '}' && result.endsWith('"')) {
    const keyStart = findStringStart(result);
    if (keyStart !== -1) {
      const before = result.slice(0, keyStart).replace(/\s+$/, '');
      const prev = before.slice(-1);
      if (prev === '{') return before;
      if (prev === ',') return before.slice(0, -1);
    }
  }

  return result;
}

/**
 * מאתר את מיקום ה-`"` הפותח של מחרוזת ה-JSON שמסתיימת בסוף `result`. מחזיר -1
 * אם לא נמצא פותח תקין. סורק אחורה ומדלג על מירכאות שה-escaped.
 */
function findStringStart(result: string): number {
  // מדלגים על ה-`"` הסוגר עצמו.
  for (let i = result.length - 2; i >= 0; i--) {
    if (result[i] === '"') {
      // סופרים backslashes שלפני המירכאות — מספר זוגי = מירכאות פותחות אמיתיות.
      let backslashes = 0;
      for (let j = i - 1; j >= 0 && result[j] === '\\'; j--) backslashes++;
      if (backslashes % 2 === 0) return i;
    }
  }
  return -1;
}
