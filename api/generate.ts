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

  try {
    // streaming כדי לא לחטוף timeout על פלט JSON גדול (ראה מדריך ה-API)
    const stream = client.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 32_000,
      thinking: { type: 'adaptive' },
      // effort high לאיכות מקסימלית. הזמן הארוך (maxDuration 800) מכסה את החשיבה
      // הנוספת, כך שאין חשש טיימאוט.
      output_config: { effort: 'high' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `צור לומדה מהתוכן הבא:\n\n${text}` }],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      res.status(422).json({ error: 'הבקשה נדחתה על ידי מנגנוני הבטיחות. נסו תוכן אחר.' });
      return;
    }

    const course = extractCourseJson(message);
    if (!course) {
      res.status(502).json({ error: 'המודל לא החזיר JSON תקין. נסו שוב.' });
      return;
    }

    res.status(200).json({ course });
  } catch (error) {
    console.error('generate failed', error);
    res.status(502).json({ error: 'יצירת הלומדה נכשלה. נסו שוב בעוד רגע.' });
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
- divider — מפריד. style(space|line|icon|gradient), icon, height.`;

const RICH_TEXT = `doc הוא מסמך ProseMirror: { "type":"doc", "content":[ ... ] }.
nodes מותרים: doc, paragraph, text, heading(attrs.level 2–4), bulletList, orderedList, listItem, blockquote, hardBreak.
marks מותרים: bold, italic, underline, strike, link.
דוגמה: {"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"כותרת"}]},{"type":"paragraph","content":[{"type":"text","text":"פסקה."}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"פריט"}]}]}]}]}`;

const THEMES = 'ערכות עיצוב (בחר id בשדה theme של הלומדה): clean, darkElegant, vivid, warmSand, forest, highContrast, sunset, midnight.';

const EXAMPLE = {
  title: 'בטיחות במשרד',
  subtitle: 'לומדת מבוא קצרה',
  theme: 'clean',
  chapters: [
    {
      title: 'פתיחה',
      blocks: [
        {
          type: 'hero',
          content: { variant: 'spotlight', title: 'בטיחות במשרד', subtitle: 'מה כל עובד צריך לדעת' },
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
            columns: 3,
            items: [
              { icon: 'ShieldCheck', title: 'דיווח', text: 'מדווחים על כל מפגע לממונה.' },
              { icon: 'Flame', title: 'כיבוי אש', text: 'מכירים את מיקום המטפים.' },
              { icon: 'DoorOpen', title: 'יציאות', text: 'יודעים את דרכי המילוט.' },
            ],
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
  'מבנה: לומדה = { title, subtitle, description, theme, chapters:[...] }.',
  'כל פרק = { title, description, blocks:[...] }. כל בלוק = { type, content:{...} }.',
  'אין צורך ב-id או ב-settings — המערכת משלימה אותם.',
  '',
  'הנחיות:',
  '- פתח כל לומדה בבלוק hero עם כותרת וכותרת משנה.',
  '- למגוון חזותי השתמש ב-cards, accordion, stats, quote ו-quiz — לא רק בפסקאות.',
  '- בלוק quiz חייב תשובה נכונה אחת בדיוק.',
  '- תמונות: אל תמציא assetId. בבלוקי image/textImage/hero כתוב בשדה "query" תיאור',
  '  קצר *באנגלית* לחיפוש תמונת סטוק (למשל "modern office team"), ו-"alt" בעברית לנגישות.',
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
