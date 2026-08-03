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
      messages: [
        {
          role: 'user',
          content:
            'צור לומדה איכותית, יצירתית ומעמיקה מהתוכן הבא — עם מלל עשיר ופרומפטי תמונה ייחודיים:\n\n' +
            text,
        },
      ],
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
  hero: '- hero — מסך פתיחה. variant(centered|spotlight|panel|minimal), title, subtitle, intro, backgroundType(color|gradient|image), backgroundColor, gradientFrom, gradientTo, height(compact|medium|tall|screen), alignment(start|center|end). לרקע תמונה: backgroundType="image" + query (פרומפט יצירתי באנגלית, ראה כללי תמונה) + alt בעברית.',
  richText: '- richText — טקסט רץ. doc (מסמך ProseMirror, ראה למטה), maxWidth(narrow|normal|wide).',
  image: '- image — תמונה. query (פרומפט יצירתי באנגלית — לא קלישאה גנרית), alt בעברית, caption, aspectRatio(auto|16:9|4:3|1:1|3:2|21:9), fit(cover|contain), roundness(none|small|medium|large|full).',
  textImage: '- textImage — טקסט לצד תמונה. doc, query (פרומפט יצירתי באנגלית), alt, caption, layout(imageStart|imageEnd|imageTop), ratio(50-50|40-60|60-40), variant(standard|feature).',
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

const THEMES = [
  'ערכות עיצוב (בחר id בשדה theme — התאם לנושא ולטון):',
  '- clean — נקי ובהיר: נהלים, מדיניות, הדרכות ארוכות.',
  '- darkElegant — כהה שקט עם תכלת: מצגות תדמית, תוכן קצר אלגנטי.',
  '- vivid — טורקיז ואלמוג: אונבורדינג והדרכות קצרות ואנרגטיות.',
  '- warmSand — חול חם: קריאה ארוכה וסיפורית.',
  '- forest — ירוק יער: נהלים רציניים, בטיחות, ציות.',
  '- highContrast — שחור-לבן+צהוב: נגישות ומסכים חלשים.',
  '- sunset — ורוד/ענבר חגיגי: השקות, קמפיינים, אונבורדינג חם.',
  '- midnight — נייבי+ציאן זוהר: מצגות דרמטיות ותוכן קצר מודרני.',
].join('\n');

const GENERIC_EXAMPLE = {
  title: 'בטיחות במשרד',
  subtitle: 'מודעות שמצילה חיים — לא עוד נוהל שנשכח',
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
            subtitle: 'מה כל עובד צריך לדעת לפני שמשהו קורה',
            intro: 'כ־5 דקות קריאה',
            backgroundType: 'image',
            query:
              'empty office corridor at dusk, emergency exit glow reflected on polished floor, cinematic still, quiet tension',
            alt: 'מסדרון משרד עם שלט יציאת חירום',
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
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'רוב תאונות המשרד לא קורות בגלל ציוד מסוכן — אלא בגלל הרגלים קטנים שמתעלמים מהם: כבל על הרצפה, יציאה חסומה, עיכוב בדיווח. סביבה בטוחה מתחילה במודעות יומיומית של כולם, לא רק בממונה הבטיחות.',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'העמוד הזה מרכז שלושה עקרונות שאפשר ליישם עוד היום — בלי ציוד מיוחד ובלי הכשרה ארוכה.',
                    },
                  ],
                },
              ],
            },
          },
          settings: { background: 'gradientSoft' },
        },
        {
          type: 'image',
          content: {
            query:
              'top-down watercolor sketch of a cluttered desk edge with a trailing power cable near a chair leg, soft caution mood',
            alt: 'כבל חשמל משוך ליד כיסא — מפגע נפוץ',
            caption: 'מפגעים נראים טריוויאליים — עד שהם לא.',
          },
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
              {
                icon: 'Shield',
                title: 'דיווח מיידי',
                text: 'מפגע שראיתם ולא דיווחתם עליו — נשאר מפגע. מעבירים לממונה באותו היום, גם אם "רק נראה קטן".',
              },
              {
                icon: 'AlertTriangle',
                title: 'כיבוי אש',
                text: 'לפני שצריך: דעו איפה המטף הקרוב ואיך מפעילים אותו. בדקה של עשן אין זמן לחפש הוראות.',
              },
              {
                icon: 'Route',
                title: 'דרכי מילוט',
                text: 'לכו פעם אחת את מסלול היציאה מהשולחן שלכם עד החוץ. יציאה חסומה בארגזים היא לא "זמני" — היא סיכון.',
              },
            ],
          },
        },
        {
          type: 'quote',
          content: {
            variant: 'band',
            text: 'בטיחות היא לא נוהל על הקיר — היא הרגל יומיומי של כולנו.',
            author: '',
          },
        },
        {
          type: 'quiz',
          content: {
            question: 'מה עושים ברגע שמזהים מפגע בטיחותי במשרד?',
            hint: 'חשבו מה מונע את הסיכון הכי מהר.',
            options: [
              { text: 'מדווחים לממונה ומוודאים שהטיפול מתועד', correct: true },
              { text: 'מתעלמים וממשיכים — "מישהו אחר יטפל"', correct: false },
              { text: 'מחכים לישיבת הבטיחות הבאה', correct: false },
            ],
            feedbackCorrect: 'נכון — דיווח מיידי סוגר את הפער בין "ראיתי" לבין "טיפלו".',
            feedbackIncorrect: 'דחייה משאירה את הסיכון פעיל. הדיווח הוא הצעד הראשון, לא האחרון.',
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
            query:
              'single focused spotlight on an open notebook and analog watch on dark wood, shallow depth of field, editorial photo',
            alt: 'מחברת פתוחה ושעון על שולחן — מיקוד במקום ריבוי',
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
                    {
                      type: 'text',
                      text: 'ניהול זמן טוב אינו "לעשות יותר באותו יום" — אלא לבחור במודע במה לא לגעת. כשהכל דחוף, שום דבר לא באמת חשוב.',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'שלוש נקודות המפתח למטה הן הרגלים שאפשר להתחיל מחר בבוקר, בלי אפליקציה חדשה ובלי יומן מושלם.',
                    },
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
              {
                icon: 'Target',
                title: 'תעדוף',
                text: 'שאלו: "אם אספיק רק דבר אחד היום — מה ישנה הכי הרבה?" התחילו משם, גם אם המייל צועק.',
              },
              {
                icon: 'Clock',
                title: 'חסימת זמן',
                text: 'הקצו בלוק של 60–90 דקות לעומק, וסגרו אותו כמו פגישה. בלי חסימה — העומק נדחק לשולי היום.',
              },
              {
                icon: 'Zap',
                title: 'הסחות',
                text: 'כבו התראות בזמן עבודה ממוקדת. כל קפיצה לטלפון עולה כמה דקות של חזרה לריכוז — לא רק "רגע".',
              },
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
            query:
              'headset resting on empty call-center desk at blue hour, soft bokeh screens behind, documentary candid photo',
            alt: 'אוזניות על שולחן במוקד שירות בשעת בין-ערביים',
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
                    {
                      type: 'text',
                      text: 'כשכל נציג פותח קריאה "בדרך שלו", פניות נופלות בין מחלקות — והלקוח משלם בזמן. תהליך אחיד לא מחליף שיקול דעת; הוא מבטיח שאף פנייה לא נעלמת.',
                    },
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
              {
                title: 'קבלת הפנייה',
                text: 'תעדו במערכת את פרטי הלקוח, ערוץ הפנייה, ומהות הבעיה במילים של הלקוח — לא בפרשנות שלכם.',
              },
              {
                title: 'סיווג דחיפות',
                text: 'קבעו עדיפות לפי ההשפעה על הלקוח והעסק (השבתה ≠ שאלה כללית). אם לא בטוחים — העדיפו דרגה גבוהה יותר.',
              },
              {
                title: 'הקצאה לטיפול',
                text: 'נתבו לגורם המקצועי המתאים, וודאו שיש בעלים ברור לקריאה. "כולם רואים" אומר שלרוב אף אחד לא מטפל.',
              },
              {
                title: 'עדכון וסגירה',
                text: 'עדכנו את הלקוח לפני הסגירה, ותעדו את הפתרון כך שהפנייה הבאה לא תתחיל מאפס.',
              },
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
            backgroundType: 'image',
            query:
              'risograph poster of a checklist clipboard and red pen hovering mid-air, bold ink layers, playful graphic',
            alt: 'לוח צ׳ק-ליסט ועט אדום בסגנון פוסטר',
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
                    {
                      type: 'text',
                      text: 'פרסום בלי בדיקה אחרונה הוא הימור מיותר: קישור שבור, תמונה מטושטשת או שגיאת כתיב מגיעים בדיוק לקהל שאתם מנסים לשכנע. עברו על הרשימה לפני כל פרסום — גם כשאתם ממהרים.',
                    },
                  ],
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
            query:
              'isometric diorama of a support ops floor with glowing ticket lanes converging to one desk, soft 3D render, cool blues',
            alt: 'דגם איזומטרי של מוקד עם נתיבי פניות',
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
                  content: [
                    {
                      type: 'text',
                      text: 'חברת X מטפלת באלפי פניות שירות ביום. הצמיחה הייתה מהירה — אבל התשתית התפעולית נשארה מאחור: כל צוות עבד בכלים משלו, ופניות "רגילות" חיכו בתור ליד תקלות קריטיות.',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'ההנהלה הציבה יעד ברור: לקצר את זמן התגובה בלי להגדיל את מצבת הנציגים באותו קצב.',
                    },
                  ],
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
                  content: [
                    {
                      type: 'text',
                      text: 'זמן התגובה הממוצע הגיע ל־48 שעות. הלקוחות דיווחו שאותה שאלה נשאלה שוב ושוב לנציגים שונים — והאמון בשירות ירד בדיוק כשהיקף הפניות עלה.',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'האתגר לא היה "לעבוד קשה יותר", אלא לבנות מערכת שמנתבת נכון ומשאירה ידע משותף.',
                    },
                  ],
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
              {
                icon: 'Route',
                title: 'ניתוב חכם',
                text: 'פניות סווגו אוטומטית לפי נושא ודחיפות, והגיעו ישר לצוות שיודע לטפל — בלי תור כללי ענק.',
              },
              {
                icon: 'BookOpen',
                title: 'בסיס ידע',
                text: 'תשובות נפוצות רוכזו למאגר אחד מעודכן, כדי שנציג חדש לא ימציא תשובה מאפס בכל שיחה.',
              },
              {
                icon: 'Clock',
                title: 'יעדי זמן',
                text: 'הוגדרו יעדי תגובה שקופים לפי רמת דחיפות — והם נמדדו בפועל, לא רק נכתבו במצגת.',
              },
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
            text: 'השיפור הגדול ביותר לא בא מגיוס המוני — אלא מניתוב נכון וממאגר ידע משותף. כשהפנייה מגיעה לאדם הנכון בפעם הראשונה, הזמן והאמון חוזרים יחד.',
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
            query:
              'close-up of a hand hovering over a phone receiver, warm late-afternoon light through blinds, film still tension',
            alt: 'יד מעל שפופרת טלפון באור שקיעה — רגע לפני מענה',
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
            backgroundType: 'image',
            query:
              'conceptual surreal metaphor: glowing padlock dissolving into binary moths over a dark keyboard, ink and light, mysterious',
            alt: 'מנעול זוהר מתפרק מעל מקלדת — מטאפורה לאבטחת מידע',
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
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'השאלות הבאות בודקות לא רק "מה כתוב בנוהל" — אלא איך תפעלו ברגע האמת. קראו לאט, בחרו, וקראו את ההסבר גם כשצדקתם.',
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          type: 'challenge',
          content: {
            intro: 'ענו על כל השאלות. אחרי כל תשובה — קראו את ההסבר; שם נמצא הלמידה האמיתית.',
            passScore: 75,
            resultPass: 'כל הכבוד — אתם מזהים סיכונים ומגיבים נכון תחת לחץ.',
            resultFail: 'לא נורא. חזרו על ההסברים לשאלות שפספסתם, ונסו שוב עם עיניים חדות יותר.',
            questions: [
              {
                prompt: 'קיבלתם מייל דחוף "מהמנהל" עם קישור לעדכון סיסמה. מה הצעד הנכון?',
                explanation:
                  'לא לוחצים על קישורים ממייל חשוד — גם כשהטון דחוף. מדווחים לצוות האבטחה ובודקים בערוץ פנימי אמין. דחיפות היא טריק נפוץ של פישינג.',
                options: [
                  { text: 'מדווחים לצוות האבטחה ולא לוחצים על הקישור', correct: true },
                  { text: 'לוחצים לבדוק אם הקישור באמת נפתח', correct: false },
                  { text: 'מעבירים לחברים כדי להזהיר אותם עם אותו קישור', correct: false },
                ],
              },
              {
                prompt: 'מה הופך סיסמה לחזקה באמת?',
                explanation:
                  'אורך ומורכבות חשובים יותר מהחלפה תכופה של סיסמה קצרה וחלשה. משפט סיסמה ארוך (passphrase) עדיף על מילה בודדת עם ספרה בסוף.',
                options: [
                  { text: 'ארוכה ומורכבת — עדיף משפט סיסמה', correct: true },
                  { text: 'השם הפרטי שלכם עם השנה הנוכחית', correct: false },
                  { text: '123456 — קל לזכור ולכן "בטוח לתפעול"', correct: false },
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
  role:
    'אתה מחולל לומדות בעברית ברמה עריכתית גבוהה. קלט: תוכן גולמי. פלט: דף JSON ' +
    'שמרגיש כמו מוצר למידה מקורי — עמוק, קריא וייחודי לנושא — לא תבנית ריקה.',
  interview: [
    '- חלץ את הרעיונות, המתחים והדוגמאות הקונקרטיות מהמקור — לא רק כותרות.',
    '- בנה קשת: פתיחה שמעוררת עניין → גוף שמסביר עם דוגמאות → תרגול/מסר לסיום.',
    '- כתוב מלל עשיר: פסקאות עם הקשר והשלכה, לא משפט בודד לכל סעיף.',
  ].join('\n'),
  skeleton: [
    'פתח ב-hero מרשים (spotlight/panel, עדיף backgroundType="image" עם query יצירתי, או gradient נועז; height "tall").',
    'גוון בלוקים — richText עשיר, cards, accordion, quote, quiz/image — לא רק פסקאות דלות.',
    'עטוף 1-2 סקשנים ב-settings:{ background }. העדף ערכות נועזות (vivid, sunset, midnight, forest) על clean כשמתאים.',
  ].join('\n'),
  allowedBlocks: ALL_BLOCKS,
  example: GENERIC_EXAMPLE,
};

const FORMAT_MODULES: Record<string, FormatModule> = {
  onePager: {
    role:
      'אתה עורך תוכן שמזקק חומר ל-One Pager חד ובלתי נשכח: עמוד אחד שסורקים מהר — ' +
      'אבל כל שורה נושאת משקל. תמצית חדה, לא דף ריק.',
    interview: [
      '- זהה את המסר המרכזי האחד, והניסוח הכי מדויק שלו (לא סיסמה גנרית).',
      '- חלץ בדיוק 3 או 4 נקודות מפתח — לכל אחת תובנה חדה + פרט/דוגמה מהמקור.',
      '- נסח משפט "לקחת הביתה" אחד שממשיכים לצטט אחרי הקריאה.',
      '- זרוק רעש — אבל אל תרוקן: תמצית איכותית עמוקה יותר מרשימת כותרות.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד בלבד, בלי פרקים נוספים.',
      'פתח ב-hero מרשים — עדיף backgroundType="image" עם query יצירתי וייחודי לנושא; height "tall".',
      'אחריו richText פתיח (2–3 משפטים חדים שממקמים את הבעיה/ההזדמנות).',
      'cards: 3 או 4, variant "numbered"/"gradient", לכל כרטיס icon + טקסט עם תובנה מוחשית.',
      'סיים ב-callout "takeaway". quote רק אם יש ייחוס אמיתי במקור.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'cards', 'callout', 'quote', 'image', 'divider'],
    example: ONE_PAGER_EXAMPLE,
  },
  process: {
    role:
      'אתה מעצב הדרכה שהופך נוהל לתהליך שאפשר לבצע בעיניים עצומות: שלבים ברורים, ' +
      'עם הקשר למה זה חשוב ומתי נכשלים.',
    interview: [
      '- זהה את השלבים לפי רצף הביצוע; אם חסר סדר — הסק אותו מההגיון.',
      '- לכל שלב: הפעולה, מי, הטריגר, והתוצאה הצפויה — בניסוח חי, לא טלגרפי מדי.',
      '- הוסף פתיח שמסביר למה התהליך קיים ומה קורה כשמדלגים.',
      '- הפרד אזהרה/נקודה קריטית ל-callout עם ניסוח שמבהיר את הסיכון.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד בלבד.',
      'פתח ב-hero — עדיף image עם query יצירתי, אחרת gradient; height "tall".',
      'richText פתיח (2–3 משפטים: מטרה + מחיר הטעות). בלוק steps עם כל השלבים (items עשירים).',
      'callout warning/info לנקודה קריטית אם יש.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'steps', 'callout', 'image', 'divider'],
    example: PROCESS_EXAMPLE,
  },
  checklist: {
    role:
      'אתה מומחה תהליך שהופך דרישות לצ׳ק-ליסט שמרגיש כמו כלי עבודה אמיתי — ' +
      'ברור, חד, ומונע טעויות נפוצות.',
    interview: [
      '- פריטים אטומיים ובני-אימות: פעולה אחת לסמן "בוצע".',
      '- ניסוח בלשון פעולה; description כשיש מלכודת/הבהרה חשובה (אל תשאיר הכל ריק סתם).',
      '- פתיח שמסביר מתי משתמשים ברשימה ולמה היא קיימת.',
      '- אל תמזג כמה פעולות לפריט אחד.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד.',
      'פתח ב-hero (עדיף image עם query ייחודי לנושא). richText שמסביר מתי/למה.',
      'checklist אחד (showCount=true) עם פריטים חדים. callout אופציונלי לטיפ/אזהרה.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'checklist', 'callout', 'divider'],
    example: CHECKLIST_EXAMPLE,
  },
  caseStudy: {
    role:
      'אתה אנליסט-מספר סיפורים: כותב מקרה בוחן חי מהרקע עד הלקחים, עם מתח, ' +
      'החלטות ותוצאות — לא תקציר יבש.',
    interview: [
      '- חלץ: הקשר, אתגר, פעולות, תוצאות, לקחים — ושמור נרטיב שממשיך בין פרקים.',
      '- העמק בכל פרק: 2–4 פסקאות או שילוב richText+cards עם פרטים מהמקור.',
      '- אל תמציא נתונים/ציטוטים; author ריק אם אין ייחוס. מותר להעמיק בניסוח.',
    ].join('\n'),
    skeleton: [
      'פרקים: "רקע", "האתגר", "מה נעשה", "תוצאות ולקחים".',
      'פתח ב-hero עם query יצירתי. richText לסיפור, cards/textImage לפעולות, quote לנתון בולט.',
      'סיים ב-callout takeaway עם הלקח המרכזי בניסוח חד.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'textImage', 'quote', 'callout', 'cards', 'divider'],
    example: CASE_STUDY_EXAMPLE,
  },
  scenario: {
    role:
      'אתה תסריטאי הדרכה. תרחיש כמו סיפור קצר קולנועי: סצנה חיה, דמות שהלומד מגלם, ' +
      'ובחירות עם השלכות אנושיות — לא מבחן נכון/לא נכון.',
    interview: [
      '- סצנת פתיחה עשירה: מקום, זמן, מי, מה קורה, ומה מונח על הכף.',
      '- 2–3 רגעי החלטה לאורך ציר זמן; בין לבין פסקת-גשר שממשיכה את הסיפור.',
      '- כל feedback הוא השלכה סיפורית חיה — לא "נכון/לא נכון".',
      '- דיבריף (callout) שמזקק עיקרון מהסיפור בניסוח שאפשר לזכור.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד — עשיר ונרטיבי.',
      'hero → richText (סצנה 4–7 משפטים) → decision → richText גשר → decision → [אופציונלי 3]',
      '→ callout takeaway. לכל decision 2–4 אפשרויות אמינות עם feedback סיפורי.',
    ].join('\n'),
    allowedBlocks: ['hero', 'richText', 'image', 'decision', 'callout', 'divider'],
    example: SCENARIO_EXAMPLE,
  },
  challenge: {
    role:
      'אתה בוחן שמכין מבחן "בחן את עצמך" מחכים: שאלות שבודקות הבנה אמיתית, ' +
      'עם מסיחים חכמים והסברים שמלמדים.',
    interview: [
      '- חלץ עובדות/עקרונות ברי-בדיקה; הפוך לשאלות שדורשות הבנה, לא שינון מילה.',
      '- לכל שאלה תשובה נכונה אחת + מסיחים אמינים שמבוססים על טעויות נפוצות.',
      '- explanation שמסביר למה הנכון נכון (ולמה המסיח מפתה) — 1–2 משפטים עשירים.',
      '- passScore סביר + משוב מעבר/כישלון עם טון מעודד ומדויק.',
    ].join('\n'),
    skeleton: [
      'פרק יחיד. hero (עדיף עם query יצירתי). richText הנחיה קצרה אבל ממוקדת.',
      'challenge אחד עם 3–6 שאלות, passScore, resultPass, resultFail.',
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
  '═══ איכות ויצירתיות (חובה) ═══',
  'אתה לא ממלא תבנית — אתה כותב לומדה שמרגישה ייחודית ל*התוכן הזה*.',
  '- עומק: הסתמך על פרטים קונקרטיים מהמקור (שמות, מספרים, מצבים, דילמות). אל תסתפק',
  '  במשפטי-מסגרת ריקים ("חשוב לזכור", "יש לשים לב"). כל פסקה צריכה ללמד משהו.',
  '- קול: כתוב בעברית חיה, מדויקת ומעניינת — לא סלנג ארגוני ולא רשימת תבליטים יבשה.',
  '  גוון במשפטים קצרים וארוכים; השתמש ב-bold לנקודות מפתח בתוך פסקאות.',
  '- מלל: עדיף 2–4 פסקאות עשירות על משפט בודד דל. בכל מקום שהפורמט מאפשר richText —',
  '  תן הקשר, דוגמה והשלכה. כרטיסים/שלבים/פריטים: כל פריט עם תובנה חדה + פרט מוחשי.',
  '- ייחודיות: שתי לומדות על נושאים שונים לא אמורות להישמע אותו דבר. התאם מטאפורות,',
  '  דוגמאות וטון לנושא (רפואי ≠ מכירות ≠ בטיחות).',
  '- חדשנות במבנה: גוון variants, רקעים (settings.background), וסוגי בלוקים — בלי',
  '  לחרוג מהבלוקים המותרים לפורמט.',
  '',
  '═══ תמונות / query ═══',
  'Lomdi לא מייצר תמונות. כל image/textImage ו-hero עם backgroundType="image" חייב',
  '"query" באנגלית + "alt" בעברית. ה-query מוצג למשתמש כהמלצה ליצירה חיצונית.',
  '- query יצירתי וספציפי (כ־12–28 מילים): נושא + קומפוזיציה + תאורה/מצב רוח + סגנון.',
  '- גוון סגנונות בין לומדות ובתוך לומדה — אל תחזור תמיד על "flat vector illustration".',
  '  דוגמאות לסגנונות: editorial photo, cinematic still, watercolor sketch, isometric',
  '  diorama, risograph poster, documentary candid, conceptual surreal metaphor,',
  '  paper-cut collage, soft 3D render, ink line drawing.',
  '- הימנע מקלישאות: "modern office team", "diverse colleagues smiling", "handshake".',
  '  העדף זווית בלתי שגרתית הקשורה *לרעיון* שבלוק (מטאפורה ויזואלית, רגע אנושי, פרט).',
  '- כלול לפחות מקום תמונה אחד עם query (hero image או בלוק image).',
  '',
  'כללי ברזל:',
  '- השתמש רק בסוגי הבלוקים המותרים לפורמט (ראה קטלוג למטה). אל תשתמש בסוג שאינו ברשימה.',
  '- בחר theme שמתאים לנושא (ראה רשימה למטה).',
  '- בלוק quiz חייב תשובה נכונה אחת בדיוק.',
  '- אל תמציא ייחוס בשם לציטוט (author/role) — אלא אם הוא מופיע במפורש במקור.',
  '  בלי מקור אמין, השאר author ריק או ותר על ה-quote.',
  '- אל תמציא נתונים/עובדות שאינם במקור; מותר להעמיק בניסוח ובדוגמאות שמבוססות עליו.',
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
