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

  // דופק ראשון מיידי + כל 10 שניות: שומר את החיבור חי בזמן שהמודל חושב וכותב.
  writeLine({ type: 'progress' });
  const heartbeat = setInterval(() => writeLine({ type: 'progress' }), 10_000);

  // אם הלקוח מתנתק — עוצרים את היצירה ומפסיקים לכתוב, כדי לא לשרוף זמן ריצה לחינם.
  res.on('close', () => {
    open = false;
    clearInterval(heartbeat);
    stream.abort();
  });

  try {
    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      writeLine({ type: 'error', error: 'הבקשה נדחתה על ידי מנגנוני הבטיחות. נסו תוכן אחר.' });
    } else {
      const course = extractCourseJson(message);
      if (!course) {
        writeLine({ type: 'error', error: 'המודל לא החזיר JSON תקין. נסו שוב.' });
      } else {
        writeLine({ type: 'result', course });
      }
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

/** מחלץ את גוף ה-JSON מהתשובה — גם אם המודל עטף אותו בגדרות קוד או בטקסט */
function extractCourseJson(message: Anthropic.Message): unknown {
  const raw = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
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
