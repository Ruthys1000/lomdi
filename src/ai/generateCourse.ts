import { importGeneratedCourse, type GeneratedCourse } from './importGenerated';

/**
 * צד הלקוח של יצירת לומדה מ-AI.
 *
 * שולח את הטקסט לפונקציית ה-serverless (`/api/generate`) — שם, ורק שם, חי מפתח
 * ה-API — ומעביר את ה-JSON הגולמי שחזר דרך `importGeneratedCourse`. הריפוי,
 * הליטוש והאימות רצים כאן בצד הלקוח, לצד העורך וה-stores.
 */

const ENDPOINT = '/api/generate';

export interface GenerateCourseOptions {
  signal?: AbortSignal;
  /** נקרא על כל פעימת התקדמות מהשרת — שימושי לחיווי "עדיין עובד" */
  onProgress?: () => void;
  /** מזהה הפורמט שנבחר — נשלח לשרת (לבחירת ה"אישיות") ומוזרק ל-Course.format */
  format?: string;
}

/**
 * ה-endpoint מזרים שורות NDJSON: `progress` (דופק ששומר את החיבור חי),
 * `result` (הלומדה הגמורה) או `error` (הודעה למשתמש). קוראים אותן תוך כדי,
 * כך שחיבור ארוך לא "נשתק" ונחתך על ידי הדפדפן ("Failed to fetch").
 */
type StreamLine =
  | { type: 'progress' }
  | { type: 'result'; course?: unknown }
  | { type: 'error'; error?: unknown };

export async function generateCourseFromText(
  text: string,
  options: GenerateCourseOptions = {},
): Promise<GeneratedCourse> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, ...(options.format ? { format: options.format } : {}) }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  // אימותי קלט נכשלים לפני הסטרימינג ומוחזרים כ-JSON עם קוד סטטוס.
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  // תאימות לאחור: אם אין גוף מוזרם (למשל בסביבת בדיקה ישנה) — קוראים JSON יחיד.
  if (!response.body) {
    const data = (await response.json()) as { course?: unknown };
    return importGeneratedCourse(data.course, { format: options.format });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handle = (line: StreamLine): GeneratedCourse | undefined => {
    if (line.type === 'progress') {
      options.onProgress?.();
      return undefined;
    }
    if (line.type === 'error') {
      const message = typeof line.error === 'string' && line.error ? line.error : undefined;
      throw new Error(message ?? 'יצירת הלומדה נכשלה.');
    }
    return importGeneratedCourse(line.course, { format: options.format });
  };

  // שורה שאינה JSON תקין (דופק שנחתך באמצע, הזרקת פרוקסי) — מדלגים עליה במקום
  // להפיל את כל היצירה בחריגה לא-מטופלת. שורות ה-result/error מגיעות מהשרת שלנו
  // כ-JSON תקין תמיד, כך שדילוג פוגע רק בשורות רעש.
  const parseLine = (raw: string): StreamLine | undefined => {
    try {
      return JSON.parse(raw) as StreamLine;
    } catch {
      return undefined;
    }
  };

  // כל שורה שלמה (מופרדת ב-\n) היא אובייקט JSON אחד.
  const drain = (chunk: string): GeneratedCourse | undefined => {
    buffer += chunk;
    let newline: number;
    while ((newline = buffer.indexOf('\n')) !== -1) {
      const raw = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!raw) continue;
      const line = parseLine(raw);
      if (!line) continue;
      const result = handle(line);
      if (result) return result;
    }
    return undefined;
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const result = drain(decoder.decode(value, { stream: true }));
    if (result) return result;
  }

  // השורה האחרונה עשויה להגיע בלי \n מסיים.
  const tail = buffer.trim();
  if (tail) {
    const line = parseLine(tail);
    if (line) {
      const result = handle(line);
      if (result) return result;
    }
  }

  throw new Error('יצירת הלומדה הסתיימה ללא תוצאה. נסו שוב.');
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === 'string' && data.error) return data.error;
  } catch {
    // גוף לא-JSON — ניפול להודעה גנרית לפי הסטטוס
  }
  return `יצירת הלומדה נכשלה (שגיאה ${response.status}).`;
}
