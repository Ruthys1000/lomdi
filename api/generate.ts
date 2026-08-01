import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { buildGenerationContract, type GenerationContract } from '../src/ai/contract';

/**
 * פונקציית ה-serverless שמחוללת לומדה מטקסט.
 *
 * זהו הצד המאובטח של החיבור ל-AI: מפתח ה-API חי כאן בלבד (משתנה סביבה בשרת),
 * והדפדפן לעולם לא רואה אותו. הפונקציה חד-תכליתית בכוונה — היא מקבלת טקסט
 * ומחזירה JSON של לומדה, ותו לא — כדי שלא תהפוך ל"ממסר פתוח" שמריץ כל פרומפט
 * על חשבון המפתח.
 *
 * הפלט מוחזר *גולמי*: האימות והריפוי (`importGeneratedCourse`) רצים בצד הלקוח,
 * שם ממילא חיים העורך וה-stores.
 */

export const config = { maxDuration: 60 };

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

  const contract = buildGenerationContract();
  const client = new Anthropic({ apiKey });

  try {
    // streaming כדי לא לחטוף timeout על פלט JSON גדול (ראה מדריך ה-API)
    const stream = client.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 32_000,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: systemPrompt(contract), cache_control: { type: 'ephemeral' } }],
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

/** המפרט שמזין את המודל — נגזר מהחוזה, כדי שלא יסטה ממה שהמערכת מקבלת */
function systemPrompt(contract: GenerationContract): string {
  const blocks = contract.blocks.map((block) => ({
    type: block.type,
    label: block.label,
    description: block.description,
    category: block.category,
    contentSchema: block.schema,
  }));

  return [
    'אתה מחולל לומדות (קורסים דיגיטליים) בעברית. קלט: תוכן גולמי. פלט: לומדה אחת כ-JSON.',
    '',
    contract.guide,
    '',
    'מבנה הלומדה (JSON Schema):',
    JSON.stringify(contract.course),
    '',
    'סוגי הבלוקים המותרים, כל אחד עם סכמת התוכן שלו:',
    JSON.stringify(blocks),
    '',
    'ערכות עיצוב זמינות (בחר לפי id בשדה theme):',
    JSON.stringify(contract.themes),
    '',
    'טקסט עשיר (doc) מותר רק עם ה-nodes וה-marks הבאים:',
    JSON.stringify(contract.richText),
    '',
    'דוגמה מלאה ותקינה:',
    JSON.stringify(contract.example),
    '',
    'החזר אך ורק את ה-JSON של הלומדה — בלי טקסט לפניו או אחריו, ובלי גדרות קוד (```).',
  ].join('\n');
}
