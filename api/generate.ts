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

  const body = (req.body ?? {}) as { text?: unknown; format?: unknown };
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  // מזהה הפורמט קובע את "האישיות" של הפרומפט. חסר/לא-מוכר → מודול גנרי.
  const format = typeof body.format === 'string' ? body.format : undefined;
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

  // הפרומפט נבנה פעם אחת לפי הפורמט, ומשמש את שני ניסיונות היצירה.
  const systemPrompt = buildSystemPrompt(format);

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
      // Opus ולא Sonnet: איכות ועושר התוכן חשובים כאן יותר מהמהירות — התרחישים
      // והדפים יוצאים "רזים" מדי עם מודל מהיר. ה-heartbeat של הסטרימינג ממילא
      // שומר על החיבור חי לאורך ההמתנה הארוכה יותר, ושכבת הריפוי מבטיחה חוסן.
      model: 'claude-opus-5',
      max_tokens: 32_000,
      thinking: { type: 'adaptive' },
      // effort medium מאזן איכות מול זמן: יצירת ה-JSON היא משימת חילוץ מובנית,
      // לא הוכחה מתמטית, ו-high האריך את ההמתנה מדי.
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `צור דף מהתוכן הבא:\n\n${text}` }],
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

// קטלוג הבלוקים כמפה type→שורה, כדי שכל פורמט יציג רק את הבלוקים המותרים לו —
// זה מה שמונע מהמודל "לנדוד" לבלוקים שלא שייכים לפורמט (התיקון ל"גנרי מדי").
const BLOCK_LINES: Record<string, string> = {
  hero: '- hero — מסך פתיחה. variant(centered|spotlight|panel|minimal), title, subtitle, intro, backgroundType(color|gradient|image), backgroundColor, gradientFrom, gradientTo, height(compact|medium|tall|screen), alignment(start|center|end). לרקע תמונה: backgroundType="image" + query + alt.',
  richText: '- richText — טקסט רץ. doc (מסמך ProseMirror, ראה למטה), maxWidth(narrow|normal|wide).',
  image: '- image — תמונה. query (פרומפט קצר באנגלית לתמונה), alt, caption, aspectRatio(auto|16:9|4:3|1:1|3:2|21:9), fit(cover|contain), roundness(none|small|medium|large|full).',
  textImage: '- textImage — טקסט לצד תמונה. doc, query (פרומפט קצר באנגלית), alt, caption, layout(imageStart|imageEnd|imageTop), ratio(50-50|40-60|60-40), variant(standard|feature).',
  cards: '- cards — כרטיסים. variant(plain|numbered|gradient|outline), columns(2-4), items:[{icon, title, text}].',
  accordion: '- accordion — פריטים נפתחים. items:[{title, doc}], mode(single|multiple), openFirstByDefault.',
  quiz: '- quiz — שאלת בחירה. question, hint, options:[{text, correct}] (בדיוק אחת correct:true), feedbackCorrect, feedbackIncorrect.',
  quote: '- quote — ציטוט. variant, text, author, role.',
  video: '- video — וידאו. source(youtube|vimeo|upload), url.',
  divider: '- divider — מפריד. style(space|line|icon|gradient), icon, height.',
  callout: '- callout — מסר מרכזי בולט. variant(takeaway|info|success|warning), icon(שם lucide, למשל Lightbulb/AlertTriangle), title, text.',
  steps: '- steps — רצף שלבים ממוספר. variant(numbered|arrow), items:[{title, text}].',
  checklist: '- checklist — פריטים לסימון. items:[{text, description}] (description קצר ואופציונלי), showCount(bool).',
  decision: '- decision — נקודת החלטה בתרחיש. prompt, options:[{text, feedback}] (בלי "נכון" — לכל בחירה feedback/השלכה משלה), allowReselect(bool).',
  challenge: '- challenge — בחן את עצמך. intro, passScore(0-100), resultPass, resultFail, questions:[{prompt, options:[{text, correct}] (בדיוק אחת correct:true), explanation}].',
};

const SETTINGS_NOTE =
  'settings (אופציונלי, פר-בלוק, ליצירת מקצב): { background: transparent|surface|muted|primary|accent|gradient|gradientSoft }. עטוף בו סקשן בולט אחד או שניים, לא את כל הבלוקים.';

// שמות האייקונים ל-cards ו-callout — רשימה סגורה. שם מחוץ לרשימה לא מרונדר,
// ולכן חובה לבחור *רק* מכאן (מסונכרן עם src/renderer/icons.ts).
const ICON_NAMES =
  'Sparkles, Target, Lightbulb, Rocket, Star, Award, TrendingUp, Users, Shield, Lock, Clock, Flag, Compass, Route, BookOpen, FileText, ClipboardList, HelpCircle, Info, AlertTriangle, Check, CircleCheck, Heart, ThumbsUp, Zap, Settings, Mail, Play';

function catalogFor(types: string[]): string {
  const lines = types.map((type) => BLOCK_LINES[type]).filter(Boolean);
  const parts = ['סוגי הבלוקים המותרים בפורמט זה (type + השדות המרכזיים ב-content):', ...lines];
  if (types.includes('cards') || types.includes('callout')) {
    parts.push('', `אייקונים (שדה icon) — בחר *רק* מתוך הרשימה: ${ICON_NAMES}. שם מחוץ לרשימה לא יוצג.`);
  }
  parts.push('', SETTINGS_NOTE);
  return parts.join('\n');
}

const RICH_TEXT = `doc הוא מסמך ProseMirror: { "type":"doc", "content":[ ... ] }.
nodes מותרים: doc, paragraph, text, heading(attrs.level 2–4), bulletList, orderedList, listItem, blockquote, hardBreak.
marks מותרים: bold, italic, underline, strike, link.
דוגמה: {"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"כותרת"}]},{"type":"paragraph","content":[{"type":"text","text":"פסקה."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"פריט"}]}]}]}]}`;

const THEMES = 'ערכות עיצוב (בחר id בשדה theme של הלומדה): clean, darkElegant, vivid, warmSand, forest, highContrast, sunset, midnight.';

const GENERIC_EXAMPLE = {
  title: 'בטיחות במשרד',
  subtitle: 'לומדת מבוא קצרה',
  theme: 'forest',
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

/**
 * דוגמת One Pager — פרק יחיד, תמצית, נקודות מפתח ומסר לקחת הביתה.
 */
const ONE_PAGER_EXAMPLE = {
  title: 'ניהול זמן אפקטיבי',
  subtitle: 'המדריך הקצר',
  theme: 'clean',
  chapters: [
    {
      title: 'עיקר',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'spotlight',
            title: 'ניהול זמן אפקטיבי',
            subtitle: 'שלוש נקודות שישנו לכם את היום',
            backgroundType: 'image',
            query: 'calm organized desk with clock and notebook, soft daylight, flat vector illustration',
            alt: 'שולחן עבודה מסודר עם שעון',
            gradientFrom: '#2563eb',
            gradientTo: '#7c3aed',
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
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'ניהול זמן טוב הוא לא לעשות יותר — אלא לבחור נכון במה להתמקד.' },
                  ],
                },
              ],
            },
          },
        },
        {
          type: 'cards',
          content: {
            variant: 'numbered',
            columns: 3,
            items: [
              { icon: 'Target', title: 'תעדוף', text: 'התחילו מהמשימה בעלת ההשפעה הגדולה ביותר.' },
              { icon: 'Clock', title: 'חסימת זמן', text: 'הקצו בלוקים קבועים למשימות עומק.' },
              { icon: 'Zap', title: 'הסחות', text: 'כבו התראות בזמן עבודה ממוקדת.' },
            ],
          },
        },
        {
          type: 'callout',
          content: {
            variant: 'takeaway',
            icon: 'Lightbulb',
            title: 'לקחת הביתה',
            text: 'עדיפות ברורה אחת ביום שווה יותר מעשר משימות מפוזרות.',
          },
        },
      ],
    },
  ],
};

/**
 * דוגמת Process — פרק יחיד, פתיח קצר ובלוק steps עם כל השלבים.
 */
const PROCESS_EXAMPLE = {
  title: 'פתיחת קריאת שירות',
  subtitle: 'נוהל בארבעה שלבים',
  theme: 'forest',
  chapters: [
    {
      title: 'התהליך',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'panel',
            title: 'פתיחת קריאת שירות',
            subtitle: 'איך מטפלים בפנייה מהרגע הראשון',
            backgroundType: 'image',
            query: 'friendly support agent at desk with headset, clean modern office, flat vector illustration',
            alt: 'נציג שירות במוקד',
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
                {
                  type: 'paragraph',
                  content: [
                    { type: 'text', text: 'תהליך אחיד לפתיחת קריאה מבטיח שאף פנייה לא תיפול בין הכיסאות.' },
                  ],
                },
              ],
            },
          },
        },
        {
          type: 'steps',
          content: {
            variant: 'numbered',
            items: [
              { title: 'קבלת הפנייה', text: 'תעדו את פרטי הלקוח ואת מהות הבעיה במערכת.' },
              { title: 'סיווג דחיפות', text: 'קבעו רמת עדיפות לפי ההשפעה על הלקוח.' },
              { title: 'הקצאה לטיפול', text: 'נתבו את הקריאה לגורם המקצועי המתאים.' },
              { title: 'עדכון וסגירה', text: 'עדכנו את הלקוח, ותעדו את הפתרון לפני הסגירה.' },
            ],
          },
        },
        {
          type: 'callout',
          content: {
            variant: 'warning',
            icon: 'AlertTriangle',
            title: 'שימו לב',
            text: 'קריאה בדחיפות גבוהה חייבת אישור מנהל תוך שעה.',
          },
        },
      ],
    },
  ],
};

/**
 * דוגמת Checklist — פרק יחיד, פתיח קצר ובלוק checklist עם הפריטים.
 */
const CHECKLIST_EXAMPLE = {
  title: 'לפני שמפרסמים פוסט',
  subtitle: 'צ׳ק-ליסט קצר',
  theme: 'clean',
  chapters: [
    {
      title: 'הרשימה',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'panel',
            title: 'לפני שמפרסמים פוסט',
            subtitle: 'בדיקה אחרונה לפני פרסום',
            backgroundType: 'gradient',
            gradientFrom: '#2563eb',
            gradientTo: '#7c3aed',
            height: 'medium',
            fullBleed: true,
          },
        },
        {
          type: 'richText',
          content: {
            doc: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'עברו על הרשימה לפני כל פרסום, כדי לא לפספס שלב.' }],
                },
              ],
            },
          },
        },
        {
          type: 'checklist',
          content: {
            showCount: true,
            items: [
              { text: 'הגהה', description: 'קראו שוב את הטקסט לאיתור שגיאות.' },
              { text: 'תמונה ראשית', description: 'ודאו שיש תמונה באיכות טובה.' },
              { text: 'קישורים', description: 'בדקו שכל הקישורים עובדים.' },
              { text: 'תיוג', description: 'הוסיפו תגיות רלוונטיות.' },
            ],
          },
        },
        {
          type: 'callout',
          content: {
            variant: 'info',
            icon: 'Info',
            title: 'טיפ',
            text: 'שמרו את הרשימה כתבנית קבועה לכל פרסום.',
          },
        },
      ],
    },
  ],
};

/**
 * דוגמת Case Study — כמה פרקים לפי השלד רקע→אתגר→פעולה→תוצאות/לקחים.
 */
const CASE_STUDY_EXAMPLE = {
  title: 'איך חברת X קיצרה זמני תגובה',
  subtitle: 'מקרה בוחן',
  theme: 'midnight',
  chapters: [
    {
      title: 'רקע',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'panel',
            title: 'איך חברת X קיצרה זמני תגובה',
            subtitle: 'מקרה בוחן בשירות לקוחות',
            backgroundType: 'image',
            query: 'customer support team collaborating in a modern office, flat vector illustration',
            alt: 'צוות שירות לקוחות',
            gradientFrom: '#0f172a',
            gradientTo: '#334155',
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
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'ההקשר' }] },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'חברת X היא ספקית שירות עם אלפי פניות ביום.' }],
                },
              ],
            },
          },
        },
      ],
    },
    {
      title: 'האתגר',
      blocks: [
        {
          type: 'richText',
          content: {
            doc: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'זמני התגובה הגיעו ל-48 שעות, והלקוחות התלוננו.' }],
                },
              ],
            },
          },
        },
      ],
    },
    {
      title: 'מה נעשה',
      blocks: [
        {
          type: 'cards',
          content: {
            variant: 'numbered',
            columns: 3,
            items: [
              { icon: 'Route', title: 'ניתוב חכם', text: 'פניות נותבו אוטומטית לצוות המתאים.' },
              { icon: 'BookOpen', title: 'בסיס ידע', text: 'תשובות נפוצות רוכזו למאגר אחד.' },
              { icon: 'Clock', title: 'יעדי זמן', text: 'הוגדרו יעדי תגובה ברורים.' },
            ],
          },
        },
      ],
    },
    {
      title: 'תוצאות ולקחים',
      blocks: [
        {
          type: 'quote',
          content: { variant: 'band', text: 'זמן התגובה ירד מ-48 שעות לארבע.', author: '' },
        },
        {
          type: 'callout',
          content: {
            variant: 'takeaway',
            icon: 'Lightbulb',
            title: 'הלקח',
            text: 'שיפור תהליך הניתוב היה בעל ההשפעה הגדולה ביותר.',
          },
        },
      ],
    },
  ],
};

/**
 * דוגמת Scenario — מצב, נקודת החלטה עם השלכות, ולקח.
 */
const SCENARIO_EXAMPLE = {
  title: 'לקוח כועס בטלפון',
  subtitle: 'תרחיש',
  theme: 'sunset',
  chapters: [
    {
      title: 'התרחיש',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'panel',
            title: 'לקוח כועס בטלפון',
            subtitle: 'מה הייתם עושים?',
            backgroundType: 'image',
            query: 'call center agent staying calm, thoughtful, flat vector illustration',
            alt: 'נציג שירות רגוע',
            gradientFrom: '#7c2d12',
            gradientTo: '#c2410c',
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
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'שעה 16:45, יום חמישי. אתם נציג התורנות האחרון במשמרת. הטלפון מצלצל — בקו נעמה, לקוחה ותיקה, שקנתה מתנה ליום הולדת של בתה. המשלוח התעכב בשבוע, המסיבה מחר, והיא כבר לא מנסה להסתיר את הכעס. "אתם פשוט לא אכפת לכם," היא אומרת בקול רועד.',
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          type: 'decision',
          content: {
            prompt: 'איך תגיבו ברגע הראשון?',
            allowReselect: true,
            options: [
              { text: 'מסבירים מיד את מדיניות המשלוחים והעיכובים', feedback: 'נעמה מרגישה שלא הקשבתם לה. "אני לא רוצה הרצאה, אני רוצה פתרון!" — הכעס גובר.' },
              { text: 'מקשיבים עד הסוף, מאשרים את התסכול ומתנצלים בכנות', feedback: 'לרגע יש שקט. "טוב… תודה שאתה לפחות מקשיב." הנשימה שלה מתייצבת — עכשיו אפשר לדבר על פתרון.' },
              { text: 'מעבירים אותה מיד למנהל', feedback: 'ההעברה מרגישה לה כמו התחמקות. "כולם מעבירים אותי הלאה" — והיא מתחילה מחדש, מתוסכלת יותר.' },
            ],
          },
        },
        {
          type: 'richText',
          content: {
            doc: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'נעמה נרגעת מעט, אבל השאלה האמיתית עדיין על השולחן: המסיבה מחר בבוקר, והמתנה תקועה במחסן בעיר אחרת. היא מחכה לראות מה תציעו.',
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          type: 'decision',
          content: {
            prompt: 'מה תציעו לה עכשיו?',
            allowReselect: true,
            options: [
              { text: 'שליח מיוחד עוד היום, על חשבוננו', feedback: 'נעמה מופתעת לטובה. "וואו, לא ציפיתי." פתרון שמכסה על הטעות בונה נאמנות דווקא ברגע המשבר.' },
              { text: 'החזר כספי וביטול ההזמנה', feedback: 'הבעיה נסגרת טכנית, אבל נעמה נשארת בלי מתנה למחר — היא מרוצה חלקית בלבד.' },
              { text: 'מבטיחים לבדוק ולחזור אליה מחר', feedback: '"מחר כבר מאוחר מדי." הדחייה מחזירה את התסכול — לפעמים צריך להכריע כאן ועכשיו.' },
            ],
          },
        },
        {
          type: 'callout',
          content: {
            variant: 'takeaway',
            icon: 'Lightbulb',
            title: 'הלקח',
            text: 'קודם מקשיבים ומאשרים את הרגש, ורק אז פותרים — ופתרון נדיב ברגע המשבר הופך לקוח כועס לנאמן.',
          },
        },
      ],
    },
  ],
};

/**
 * דוגמת Challenge — פתיח קצר ובלוק challenge עם שאלות מדורגות.
 */
const CHALLENGE_EXAMPLE = {
  title: 'בחן את עצמך: אבטחת מידע',
  subtitle: 'מבחן קצר',
  theme: 'midnight',
  chapters: [
    {
      title: 'המבחן',
      blocks: [
        {
          type: 'hero',
          content: {
            variant: 'spotlight',
            title: 'בחן את עצמך: אבטחת מידע',
            subtitle: 'כמה שאלות קצרות',
            backgroundType: 'gradient',
            gradientFrom: '#0f172a',
            gradientTo: '#1e3a8a',
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
                { type: 'paragraph', content: [{ type: 'text', text: 'בדקו את הידע שלכם בכמה שאלות קצרות.' }] },
              ],
            },
          },
        },
        {
          type: 'challenge',
          content: {
            intro: 'בחרו את התשובה הנכונה בכל שאלה.',
            passScore: 75,
            resultPass: 'כל הכבוד! אתם שולטים בחומר.',
            resultFail: 'כדאי לחזור על החומר ולנסות שוב.',
            questions: [
              {
                prompt: 'מה עושים כשמקבלים מייל חשוד?',
                explanation: 'לא לוחצים על קישורים — מדווחים לצוות האבטחה.',
                options: [
                  { text: 'מדווחים לצוות האבטחה', correct: true },
                  { text: 'לוחצים על הקישור כדי לבדוק', correct: false },
                  { text: 'מעבירים לחברים', correct: false },
                ],
              },
              {
                prompt: 'סיסמה חזקה היא בעיקר...',
                explanation: 'אורך ומורכבות חשובים יותר מהחלפה תכופה.',
                options: [
                  { text: 'ארוכה ומורכבת', correct: true },
                  { text: 'השם הפרטי שלכם', correct: false },
                  { text: '123456', correct: false },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
};

/**
 * מודול פורמט — ה"אישיות" של הפורמט בצד ה-AI.
 *
 * מסונכרן ידנית עם `src/formats/index.ts` (allowedBlocks תואם ל-allowedBlockTypes).
 * שם חי החצי הוויזואלי; כאן חי החצי הפרומפטי.
 */
interface FormatModule {
  /** מי ה-AI עבור הפורמט הזה */
  role: string;
  /** רובריקת החילוץ — "איך לפצח את התוכן" */
  interview: string;
  /** המבנה הרצוי — פרקים, בלוקים, מה מותר ומה לא */
  skeleton: string;
  /** רק הבלוקים המותרים לפורמט — מסנן את הקטלוג */
  allowedBlocks: string[];
  /** דוגמת few-shot ייעודית לפורמט */
  example: unknown;
}

const ALL_BLOCKS = Object.keys(BLOCK_LINES);

const GENERIC_MODULE: FormatModule = {
  role: 'אתה מחולל דפי למידה בעברית. קלט: תוכן גולמי. פלט: דף אחד כ-JSON.',
  interview: [
    '- זהה את הרעיונות המרכזיים וארגן אותם להגיון ברור.',
    '- גוון בין טקסט, כרטיסים, ציטוט ושאלה כדי לשמור על עניין.',
  ].join('\n'),
  skeleton: [
    'פתח ב-hero מרשים (variant "spotlight"/"panel", backgroundType="gradient", fullBleed=true, height "tall").',
    'גוון בלוקים — cards, accordion, quote, quiz — לא רק פסקאות. עטוף 1-2 סקשנים ב-settings:{ background }.',
    'העדף ערכות נועזות (vivid, sunset, midnight, forest) על clean.',
  ].join('\n'),
  allowedBlocks: ALL_BLOCKS,
  example: GENERIC_EXAMPLE,
};

const FORMAT_MODULES: Record<string, FormatModule> = {
  onePager: {
    role: 'אתה עורך תוכן שמזקק חומר ארוך ל-One Pager — עמוד יחיד, סרוק וברור. המטרה: שהקורא יבין את המסר המרכזי במבט אחד.',
    interview: [
      '- זהה את המסר המרכזי האחד של התוכן.',
      '- חלץ בדיוק 3 או 4 נקודות מפתח תומכות (לא 5) — כדי שרשת הכרטיסים תהיה אחידה.',
      '- נסח משפט "לקחת הביתה" אחד וחד.',
      '- זרוק פרטים משניים — One Pager הוא תמצית, לא סיכום מלא.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד בלבד, בלי פרקים נוספים.',
      'פתח ב-hero מרשים — עדיף backgroundType="image" עם query (רקע חזק), אחרת גרדיאנט נועז; height "tall".',
      'אחריו richText קצר (פתיח/תמצית). cards לנקודות המפתח: 3 או 4 בלבד, variant "numbered" או "gradient", ולכל כרטיס icon מהרשימה.',
      'סיים ב-callout מסוג "takeaway" עם המסר לקחת הביתה. אפשר quote אחד אם יש ייחוס אמיתי במקור.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'cards', 'callout', 'quote', 'image', 'divider'],
    example: ONE_PAGER_EXAMPLE,
  },
  process: {
    role: 'אתה מעצב הדרכה שהופך נוהל או תהליך עבודה למדריך שלבים ברור לפי הסדר.',
    interview: [
      '- זהה את השלבים לפי הרצף הנכון לביצוע.',
      '- לכל שלב: הפעולה, מי מבצע, הטריגר להתחלה, והתוצאה.',
      '- אם השלבים לא מסודרים בתוכן — הסק את הסדר ההגיוני.',
      '- הפרד אזהרה או נקודה קריטית ל-callout נפרד.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד בלבד, בלי פרקים נוספים.',
      'פתח ב-hero מרשים — עדיף backgroundType="image" עם query, אחרת גרדיאנט נועז; height "tall".',
      'richText קצר שמסביר את מטרת התהליך. בלוק steps אחד עם כל השלבים (items:[{title, text}]).',
      'אם יש נקודה קריטית — callout מסוג "warning" או "info" (icon מהרשימה).',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'steps', 'callout', 'image', 'divider'],
    example: PROCESS_EXAMPLE,
  },
  checklist: {
    role: 'אתה מומחה תהליך וציות שהופך דרישות או שלבים לצ׳ק-ליסט ברור לאימות.',
    interview: [
      '- זהה פריטים אטומיים ובני-אימות — כל פריט פעולה אחת שאפשר לסמן "בוצע".',
      '- נסח כל פריט קצר ובלשון פעולה.',
      '- הוסף description קצר רק כשצריך הבהרה; אחרת השאר ריק.',
      '- אל תמזג כמה פעולות לפריט אחד.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד בלבד, בלי פרקים נוספים.',
      'פתח ב-hero. richText קצר שמסביר מתי ולמה משתמשים ברשימה.',
      'בלוק checklist אחד עם כל הפריטים (showCount=true). callout אופציונלי לטיפ או אזהרה.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'checklist', 'callout', 'divider'],
    example: CHECKLIST_EXAMPLE,
  },
  caseStudy: {
    role: 'אתה אנליסט שכותב מקרה בוחן: מספר את הסיפור מהרקע ועד הלקחים, בצורה מובנית.',
    interview: [
      '- חלץ חמישה מרכיבים: ההקשר/רקע, האתגר המרכזי, מה נעשה (הפעולות), התוצאות, והלקחים.',
      '- שמור על נרטיב — כל פרק ממשיך את הקודם.',
      '- אל תמציא נתונים או ציטוטים שאינם במקור; author של quote ריק אם אין ייחוס אמיתי.',
    ].join('\n'),
    skeleton: [
      'כמה פרקים לפי השלד: "רקע", "האתגר", "מה נעשה", "תוצאות ולקחים".',
      'פתח ב-hero. השתמש ב-richText לסיפור, cards/textImage לפעולות, quote לנתון בולט.',
      'סיים ב-callout מסוג "takeaway" עם הלקח המרכזי.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'textImage', 'quote', 'callout', 'cards', 'divider'],
    example: CASE_STUDY_EXAMPLE,
  },
  scenario: {
    role: 'אתה תסריטאי הדרכה. אתה כותב תרחיש כמו סיפור קצר: סצנה חיה, דמות שהלומד מגלם, ובחירות עם השלכות — לא מבחן.',
    interview: [
      '- בנה סצנת פתיחה חיה: מקום, זמן, מי נוכח, מה קורה — ובעיקר מה מונח על הכף (המתח).',
      '- אל תסתפק בנקודת החלטה אחת. פרק את הסיפור ל-2-3 רגעי החלטה לאורך ציר זמן.',
      '- בין רגע החלטה לרגע הבא, כתוב פסקה קצרה של "מה קרה בעקבות הבחירה" שממשיכה',
      '  את הסיפור ומכינה את ההחלטה הבאה.',
      '- כל feedback הוא *השלכה סיפורית* ("הלקוח נרגע…", "המצב הסלים…"), לא "נכון/לא נכון".',
      '- סיים בדיבריף קצר (callout) שמזקק את העיקרון מהסיפור.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד — אבל עשיר ונרטיבי, לא רזה.',
      'hero → richText (הסצנה, 3-5 משפטים חיים) → decision (רגע 1, allowReselect=true)',
      '→ richText (מה קרה + הכנה להחלטה הבאה) → decision (רגע 2) → [אופציונלי richText + decision 3]',
      '→ callout "takeaway" עם הלקח. לכל decision 2-4 אפשרויות אמינות עם feedback סיפורי.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'image', 'decision', 'callout', 'divider'],
    example: SCENARIO_EXAMPLE,
  },
  challenge: {
    role: 'אתה בוחן שבונה מבחן קצר "בחן את עצמך" לבדיקת ידע, עם ציון ומשוב.',
    interview: [
      '- חלץ עובדות בנות-בדיקה מהתוכן, והפוך כל אחת לשאלת בחירה.',
      '- לכל שאלה בדיוק תשובה נכונה אחת ומסיחים אמינים.',
      '- כתוב explanation קצר לכל שאלה — למה התשובה נכונה.',
      '- קבע passScore סביר (למשל 70) ומשוב מעבר/כישלון.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד. פתח ב-hero. richText קצר עם הנחיה.',
      'בלוק challenge אחד עם 3-6 שאלות, passScore, resultPass ו-resultFail.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'challenge', 'divider'],
    example: CHALLENGE_EXAMPLE,
  },
};

const SHARED_RULES = [
  'מבנה: דף = { title, subtitle, description, theme, chapters:[...] }.',
  'כל פרק = { title, description, blocks:[...] }. כל בלוק = { type, content:{...} }.',
  'אין צורך ב-id — המערכת משלימה.',
  '',
  'כללי ברזל:',
  '- השתמש רק בסוגי הבלוקים המותרים לפורמט (ראה קטלוג למטה). אל תשתמש בסוג שאינו ברשימה.',
  '- בחר theme שמתאים לנושא (ראה רשימה למטה).',
  '- בלוק quiz חייב תשובה נכונה אחת בדיוק.',
  '- תמונות: Lomdi לא מייצר תמונות. כל בלוק image/textImage, ו-hero עם',
  '  backgroundType="image", חייב שדה "query" — פרומפט קצר *באנגלית* לתמונה',
  '  (למשל "modern office team, flat vector illustration"). הוא יוצג למשתמש כהמלצה',
  '  ליצירת תמונה בעצמו; בינתיים מוצג placeholder. הוסף "alt" בעברית לנגישות.',
  '- כלול לפחות מקום תמונה אחד עם query (hero עם backgroundType="image", או בלוק',
  '  image), כדי שלמשתמש יהיה placeholder עם פרומפט מומלץ להשלמה.',
  '- אל תמציא ייחוס בשם לציטוט (author/role) — אלא אם הוא מופיע במפורש במקור.',
  '  בלי מקור אמין, השאר author ריק או ותר על ה-quote.',
].join('\n');

/**
 * מרכיב את פרומפט המערכת לפי הפורמט: מצע משותף + מודול-פורמט + קטלוג מסונן.
 * פורמט לא מוכר (או חסר) נופל ל-GENERIC_MODULE — התנהגות "חופשי" כמו לפני הפיבוט.
 */
function buildSystemPrompt(format?: string): string {
  const mod = (format && FORMAT_MODULES[format]) || GENERIC_MODULE;
  return [
    mod.role,
    '',
    'איך לפצח את התוכן לפורמט הזה:',
    mod.interview,
    '',
    'המבנה הרצוי:',
    mod.skeleton,
    '',
    SHARED_RULES,
    '',
    catalogFor(mod.allowedBlocks),
    '',
    RICH_TEXT,
    '',
    THEMES,
    '',
    'דוגמה מלאה ותקינה בפורמט הזה:',
    JSON.stringify(mod.example),
    '',
    'החזר אך ורק את ה-JSON של הדף — בלי טקסט לפניו או אחריו, ובלי גדרות קוד (```).',
  ].join('\n');
}
