import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

/**
 * פונקציית ה-serverless שמחוללת לומדה מטקסט.
 *
 * זהו הצד המאובטח של החיבור ל-AI: מפתח ה-API חי כאן בלבד (משתנה סביבה בשרת),
 * והדפדפן לעולם לא רואה אותו. הפונקציה חד-תכליתית בכוונה — מקבלת טקסט ומחזירה
 * JSON של לומדה, ותו לא — כדי שלא תהפוך ל"ממסר פתוח".
 *
 * **הפונקציה עצמאית לחלוטין ואינה מייבאת מ-`src/`.** ה-bundler של Vercel לא
 * פותר את ה-alias `@/`, וייבוא גרף האפליקציה (רגיסטרי הבלוקים, zod) הפיל את
 * הפונקציה בטעינה (FUNCTION_INVOCATION_FAILED). לכן הפרומפט מוטמע כאן כקבועים.
 * מקור האמת לקטלוג הבלוקים הוא קבצי content שבתיקיות הבלוקים; אם משתנים שדות,
 * לעדכן גם כאן. הפלט ממילא עובר ריפוי סלחני (`importGeneratedCourse`) בצד הלקוח.
 */

// חלון ריצה מקסימלי. ב-60 שניות חטפנו FUNCTION_INVOCATION_TIMEOUT על לומדות
// גדולות. בתוכנית בתשלום עם Fluid compute מותר עד 800 שניות — מגדירים את
// התקרה המלאה כדי שטיימאוט לא יהיה תרחיש כישלון. מחייבים רק על זמן ריצה בפועל,
// כך שתקרה גבוהה לא מייקרת בקשות שמסתיימות מהר.
export const config = { maxDuration: 800 };

const MAX_INPUT_CHARS = 20_000;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'שיטה לא נתמכת.' });
    return;
  }

  const body = (req.body ?? {}) as { text?: unknown };
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'לא הוזן טקסט ליצירת הלומדה.' });
    return;
  }
  if (text.length > MAX_INPUT_CHARS) {
    res.status(413).json({ error: `הטקסט ארוך מדי (מעל ${MAX_INPUT_CHARS} תווים).` });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'מפתח ה-AI לא הוגדר בשרת.' });
    return;
  }

  const client = new Anthropic({ apiKey });

  // מעבר למצב סטרימינג: מזרימים שורות NDJSON לאורך היצירה כדי שהחיבור לעולם לא
  // יהיה "שקט". דפדפן נייד או פרוקסי מנתקים חיבור שלא זורם בו מידע לאורך דקות —
  // וזה מה שגרם ל-"Failed to fetch" למרות שהפונקציה המשיכה לרוץ ברקע. אימותי
  // הקלט למעלה עדיין מחזירים JSON עם קוד סטטוס, כי הם רצים לפני שליחת הכותרות.
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no'); // מבטל באפרינג של פרוקסי (nginx)
  res.flushHeaders();

  let open = true;
  const writeLine = (payload: unknown): void => {
    if (!open) return;
    res.write(`${JSON.stringify(payload)}\n`);
  };

  // ה-stream הפעיל נשמר במשתנה כדי ש-abort (בסגירת הלקוח) יפנה תמיד לניסיון
  // הנוכחי — היצירה עשויה לרוץ בשני ניסיונות, וכל אחד פותח stream משלו.
  let activeStream: ReturnType<typeof client.messages.stream> | null = null;

  // ניסיון יצירה בודד: פותח stream, מסמן אותו כפעיל, וממתין לתשובה המלאה.
  // הפרמטרים זהים בכל ניסיון.
  const attemptGenerate = (): Promise<Anthropic.Message> => {
    const stream = client.messages.stream({
      // Sonnet ולא Opus: יצירת ה-JSON היא משימת חילוץ מובנית, ו-Sonnet מהיר
      // משמעותית באיכות דומה — קיצור ההמתנה חשוב במיוחד בנייד, שם חיבור ארוך
      // מתנתק כשעוברים אפליקציה. שכבת הריפוי (coerceGeneratedCourse) ממילא
      // מבטיחה חוסן לפלט.
      model: 'claude-sonnet-5',
      max_tokens: 32_000,
      thinking: { type: 'adaptive' },
      // effort medium מאזן איכות מול זמן: יצירת ה-JSON היא משימת חילוץ מובנית,
      // לא הוכחה מתמטית, ו-high האריך את ההמתנה מדי.
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `צור לומדה מהתוכן הבא:\n\n${text}` }],
    });
    activeStream = stream;
    return stream.finalMessage();
  };

  // דופק ראשון מיידי + כל 10 שניות: שומר את החיבור חי לאורך *כל* הניסיונות,
  // בזמן שהמודל חושב וכותב.
  writeLine({ type: 'progress' });
  const heartbeat = setInterval(() => writeLine({ type: 'progress' }), 10_000);

  // אם הלקוח מתנתק — עוצרים את הניסיון הפעיל ומפסיקים לכתוב, כדי לא לשרוף זמן
  // ריצה לחינם.
  res.on('close', () => {
    open = false;
    clearInterval(heartbeat);
    activeStream?.abort();
  });

  try {
    // ניסיון ראשון. אם לא הופק JSON שמיש — ריפוי שנכשל, קטיעה, או refusal —
    // מנסים שוב *פעם אחת*. תשובה פגומה חד-פעמית של המודל היא התקלה הנפוצה, וניסיון
    // חוזר הופך אותה להצלחה בלי שהמשתמש צריך ללחוץ "נסו שוב". שכבת ה-coerce בצד
    // הלקוח נשארת רשת הביטחון המבנית מעל שני הניסיונות.
    let message = await attemptGenerate();
    let course = extractCourseJson(message);
    if (!course && open) {
      message = await attemptGenerate();
      course = extractCourseJson(message);
    }

    if (course) {
      writeLine({ type: 'result', course });
    } else if (message.stop_reason === 'refusal') {
      writeLine({ type: 'error', error: 'הבקשה נדחתה על ידי מנגנוני הבטיחות. נסו תוכן אחר.' });
    } else if (message.stop_reason === 'max_tokens') {
      // ריפוי נכשל *וגם* התשובה נקטעה בגלל תקרת ה-tokens — הודעה ממוקדת שמכוונת
      // לפעולה, במקום ה"נסו שוב" הגנרי.
      writeLine({
        type: 'error',
        error: 'הלומדה שנוצרה ארוכה מדי והתשובה נקטעה. נסו טקסט קצר יותר או פצלו אותו לחלקים.',
      });
    } else {
      writeLine({ type: 'error', error: 'המודל לא החזיר JSON תקין. נסו שוב.' });
    }
  } catch (error) {
    // התנתקות יזומה (abort) בעקבות סגירת הלקוח אינה שגיאה אמיתית לדיווח.
    if (open) {
      console.error('generate failed', error);
      writeLine({ type: 'error', error: 'יצירת הלומדה נכשלה. נסו שוב בעוד רגע.' });
    }
  } finally {
    clearInterval(heartbeat);
    if (open) res.end();
  }
}

/**
 * מחלץ את גוף ה-JSON מהתשובה — גם אם המודל עטף אותו בגדרות קוד, הוסיף טקסט, פלט
 * פסיקים עודפים או נקטע באמצע.
 */
function extractCourseJson(message: Anthropic.Message): unknown {
  const raw = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  return parseCourseJson(raw);
}

// ─────────────────────────── ריפוי ה-JSON (מוטמע) ───────────────────────────
// הלוגיקה מוטמעת כאן ולא בקובץ אח, מאותה סיבה שהפרומפט מוטמע: Vercel פורס כל
// קובץ ב-`api/` כפונקציה serverless מבודדת, וייבוא של קובץ אח (`./lib/…`) לא נכלל
// ב-slice של הפונקציה בזמן ריצה → קריסת טעינה (FUNCTION_INVOCATION_FAILED / 500).
// לכן `generate` נשארת עצמאית לחלוטין. הבדיקות מייבאות את `parseCourseJson` מכאן.
//
// הפילוסופיה זהה לשכבת הריפוי בצד הלקוח (`coerceGeneratedCourse`): במקום לדחות
// פלט לא-מושלם, לרפא אותו ל-JSON *פרסבילי* — גם אם חלקי — ולתת ל-coerce להשלים
// את המבנה. כאן מטפלים רק ברמת התחביר; המבנה מטופל בלקוח.

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

// ─────────────────────────── הפרומפט המוטמע ───────────────────────────
// מקור האמת לשדות: src/blocks/*/content.ts. הפלט עובר ריפוי בצד הלקוח,
// ולכן דיוק חלקי כאן מספיק — coerce משלים ברירות מחדל ומשמיט שדות פגומים.

const BLOCK_CATALOG = `סוגי הבלוקים (type + השדות המרכזיים ב-content):
- hero — מסך פתיחה. variant(centered|spotlight|panel|minimal), title, subtitle, intro, backgroundType(color|gradient|image), backgroundColor, gradientFrom, gradientTo, height(compact|medium|tall|screen), alignment(start|center|end). לרקע תמונה: backgroundType="image" + query + alt.
- richText — טקסט רץ. doc (מסמך ProseMirror, ראה למטה), maxWidth(narrow|normal|wide).
- image — תמונה. query, alt, caption, aspectRatio(auto|16:9|4:3|1:1|3:2|21:9), fit(cover|contain), roundness(none|small|medium|large|full).
- textImage — טקסט לצד תמונה. doc, query, alt, caption, layout(imageStart|imageEnd|imageTop), ratio(50-50|40-60|60-40), variant(standard|feature).
- cards — כרטיסים. variant, columns(2-4), items:[{icon, title, text}].
- accordion — פריטים נפתחים. items:[{title, doc}], mode(single|multiple), openFirstByDefault.
- quiz — שאלת בחירה. question, hint, options:[{text, correct}] (בדיוק אחת correct:true), feedbackCorrect, feedbackIncorrect.
- stats — מספרים גדולים. variant, columns, items:[{value, label, sub}].
- quote — ציטוט. variant, text, author, role.
- video — וידאו. source(youtube|vimeo|upload), url.
- divider — מפריד. style(space|line|icon|gradient), icon, height.

settings (אופציונלי, פר-בלוק, ליצירת מקצב): { background: transparent|surface|muted|primary|accent|gradient|gradientSoft }. עטוף בו סקשן בולט אחד או שניים, לא את כל הבלוקים.`;

const RICH_TEXT = `doc הוא מסמך ProseMirror: { "type":"doc", "content":[ ... ] }.
nodes מותרים: doc, paragraph, text, heading(attrs.level 2–4), bulletList, orderedList, listItem, blockquote, hardBreak.
marks מותרים: bold, italic, underline, strike, link.
דוגמה: {"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"כותרת"}]},{"type":"paragraph","content":[{"type":"text","text":"פסקה."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"פריט"}]}]}]}]}`;

const THEMES = 'ערכות עיצוב (בחר id בשדה theme של הלומדה): clean, darkElegant, vivid, warmSand, forest, highContrast, sunset, midnight.';

const EXAMPLE = {
  title: 'בטיחות במשרד',
  subtitle: 'לומדת מבוא קצרה',
  theme: 'forest',
  visualStyle: {
    artStyle:
      'clean modern flat vector illustration, soft rounded shapes, calm and reassuring, ' +
      'consistent line weight, generous negative space, no text',
    palette: ['#14532d', '#166534', '#4ade80'],
    motif: 'subtle shield and leaf motifs',
  },
  chapters: [
    {
      title: 'פתיחה',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'spotlight',
            title: 'בטיחות במשרד',
            subtitle: 'מה כל עובד צריך לדעת',
            intro: 'חמש דקות',
            backgroundType: 'gradient',
            gradientFrom: '#14532d',
            gradientTo: '#166534',
            height: 'tall',
            fullBleed: true,
          },
        },
        {
          type: 'richText',
          content: {
            doc: {
              type: 'doc',
              content: [
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'למה זה חשוב' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'סביבת עבודה בטוחה מתחילה במודעות של כולם.' }] },
              ],
            },
          },
          settings: { background: 'gradientSoft' },
        },
        {
          type: 'stats',
          content: {
            variant: 'gradient',
            columns: 3,
            items: [
              { value: '90%', label: 'מהתאונות', sub: 'נמנעות במודעות פשוטה' },
              { value: '3 דק׳', label: 'זמן פינוי', sub: 'היעד בחירום' },
              { value: '24/7', label: 'דיווח', sub: 'לממונה הבטיחות' },
            ],
          },
        },
        {
          type: 'image',
          content: { query: 'modern safe office workspace', alt: 'משרד מודרני ומסודר' },
        },
      ],
    },
    {
      title: 'עקרונות',
      blocks: [
        {
          type: 'cards',
          content: {
            variant: 'gradient',
            columns: 3,
            items: [
              { icon: 'ShieldCheck', title: 'דיווח', text: 'מדווחים על כל מפגע לממונה.' },
              { icon: 'Flame', title: 'כיבוי אש', text: 'מכירים את מיקום המטפים.' },
              { icon: 'DoorOpen', title: 'יציאות', text: 'יודעים את דרכי המילוט.' },
            ],
          },
        },
        {
          type: 'quote',
          content: {
            variant: 'band',
            text: 'בטיחות היא לא נוהל — היא הרגל יומיומי של כולנו.',
            author: 'ממונה הבטיחות',
          },
        },
        {
          type: 'quiz',
          content: {
            question: 'מה עושים כשמזהים מפגע בטיחותי?',
            options: [
              { text: 'מדווחים לממונה', correct: true },
              { text: 'מתעלמים וממשיכים', correct: false },
              { text: 'מחכים שמישהו אחר יטפל', correct: false },
            ],
          },
        },
      ],
    },
  ],
};

const SYSTEM_PROMPT = [
  'אתה מחולל לומדות (קורסים דיגיטליים) בעברית. קלט: תוכן גולמי. פלט: לומדה אחת כ-JSON.',
  '',
  'מבנה: לומדה = { title, subtitle, description, theme, visualStyle, chapters:[...] }.',
  'כל פרק = { title, description, blocks:[...] }. כל בלוק = { type, content:{...} }.',
  'אין צורך ב-id — המערכת משלימה. לבלוק אפשר להוסיף settings:{ background } כדי',
  'לצבוע סקשן (ראה למטה) — השתמש בזה בחוכמה, לא בכל בלוק.',
  '',
  'הנחיות — התוכן חשוב, אבל גם המראה. אל תסתפק בגרסה השטוחה של כל בלוק:',
  '- פתח כל לומדה ב-hero מרשים: variant "spotlight" או "panel", backgroundType="gradient",',
  '  fullBleed=true, height "tall". בחר gradientFrom/gradientTo שמתאימים לנושא.',
  '- השתמש בוריאציות הפרימיום, לא רק ב-plain: cards variant "gradient" או "numbered",',
  '  stats variant "gradient", quote variant "band", textImage variant "feature".',
  '- צור מקצב: עטוף 1-2 סקשנים מרכזיים ב-settings:{ background:"gradientSoft" } או "surface"',
  '  או "primary" — לא את כולם, כדי שהצבע יבלוט. שאר הבלוקים נשארים בלי settings.',
  '- כשהתוכן מאפשר, כלול לפחות בלוק stats אחד (מספרים גדולים) וציטוט (quote) אחד.',
  '- למגוון חזותי השתמש ב-cards, accordion, stats, quote, textImage ו-quiz — לא רק בפסקאות.',
  '- בחר theme שמתאים לנושא, והעדף ערכות נועזות (vivid, sunset, midnight, forest) על clean.',
  '- בלוק quiz חייב תשובה נכונה אחת בדיוק.',
  '- תמונות: אל תמציא assetId. *כל* בלוק image ו-textImage, וכן hero עם',
  '  backgroundType="image", **חייב** שדה "query" — תיאור קצר *באנגלית* לתמונה',
  '  (למשל "modern office team"). בלי query התמונה לא תיטען. הוסף גם "alt"',
  '  בעברית לנגישות. אל תשתמש בבלוק image בלי query.',
  '- visualStyle: הגדר art direction אחד לכל הלומדה, כדי שכל התמונות ייראו כסט',
  '  מעוצב אחד ולא אוסף אקראי. אובייקט עליון: { artStyle, palette, motif }.',
  '  artStyle = תיאור סגנון האיור *באנגלית* (למשל "flat vector illustration,',
  '  soft rounded shapes, no text"); palette = מערך צבעי hex שמתאימים ל-theme;',
  '  motif = מוטיב חוזר אופציונלי. בחר סגנון שמתאים לנושא ולערכה שבחרת.',
  '',
  BLOCK_CATALOG,
  '',
  RICH_TEXT,
  '',
  THEMES,
  '',
  'דוגמה מלאה ותקינה:',
  JSON.stringify(EXAMPLE),
  '',
  'החזר אך ורק את ה-JSON של הלומדה — בלי טקסט לפניו או אחריו, ובלי גדרות קוד (```).',
].join('\n');
