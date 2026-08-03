import { zodToJsonSchema } from 'zod-to-json-schema';
import { sharedBlockRegistry } from '@/blocks/registry.shared';
import { ALLOWED_MARKS, ALLOWED_NODES } from '@/model/richText';
import { courseSchema } from '@/model/schema';
import { themePresets } from '@/model/themes';

/**
 * חוזה היצירה — המפרט היחיד שמזינים ל-LLM.
 *
 * במקום מסמך הנחיות שנכתב ביד ומתיישן, החוזה נגזר *מהסכמות עצמן*: לכל סוג
 * בלוק נבנה JSON-Schema ישירות מסכמת ה-zod שלו (`registry.shared`), ולכן
 * הוא לא יכול לסטות ממה שהמערכת באמת מקבלת. שכבת הקליטה (`coerceCourse`)
 * סלחנית בכל מקרה, אבל ככל שהפרומפט מדויק יותר, פחות דברים דורשים ריפוי.
 *
 * המודול הזה בונה מפרט, לא קורא ל-AI.
 *
 * **הוא אינו הפרומפט שרץ בפועל.** מסלול היצירה החי מזין פרומפט שמוטמע
 * ב-`api/generate.ts`, כי הפונקציה ב-Vercel אינה יכולה לייבא מ-`src/`
 * (ראה ההסבר שם). החוזה נשאר כמפרט שנגזר מהסכמות עצמן — שימושי כמקור
 * לפרומפט ולבדיקת שפיות מול הסכמה — ולכן אין לתאר בו התנהגות שהמערכת אינה
 * מבצעת: הוא נקרא כאילו הוא ההבטחה למודל.
 */

export interface BlockContract {
  type: string;
  label: string;
  description: string;
  category: string;
  /** JSON-Schema של תוכן הבלוק, נגזר מסכמת ה-zod */
  schema: unknown;
}

export interface GenerationContract {
  /** JSON-Schema של מבנה הלומדה (קורס → פרקים → בלוקים) */
  course: unknown;
  blocks: BlockContract[];
  themes: { id: string; name: string; description: string }[];
  /** הרשימה הלבנה של הטקסט העשיר — מה שמותר בתוך `doc` */
  richText: { nodes: readonly string[]; marks: readonly string[] };
  guide: string;
  /** דוגמת few-shot מינימלית ותקינה */
  example: unknown;
}

const GUIDE = `הנחיות ליצירת לומדה:
- לומדה = כותרת, כותרת משנה, ומערך "פרקים" (chapters). כל פרק מכיל מערך "בלוקים" (blocks).
- כל בלוק הוא { "type": <סוג>, "content": { ... } }. אין צורך ב-id או ב-settings — המערכת משלימה אותם.
- פתחו כל לומדה בבלוק "hero" עם כותרת וכותרת משנה.
- טקסט רץ נכתב כבלוק "richText". השדה "doc" הוא מסמך ProseMirror JSON: { "type": "doc", "content": [ ... ] }.
  מותרים רק ה-nodes וה-marks שברשימה הלבנה. כותרות גוף הן ברמות 2–4 בלבד.
- כתבו מלל עשיר וייחודי לנושא: פרטים מהמקור, דוגמאות והשלכות — לא משפטי-מסגרת ריקים.
- למגוון חזותי השתמשו ב-cards, accordion, quote ו-quiz — לא רק בפסקאות טקסט.
- בלוק שאלה (quiz) חייב תשובה נכונה אחת בדיוק.
- בחרו ערכת עיצוב לפי המזהה שלה בשדה "theme" (מחרוזת), למשל "clean" או "vivid".
- תמונות: אל תמציאו assetId. בבלוקי image/textImage/hero כתבו בשדה "query" פרומפט
  יצירתי *באנגלית* (נושא + קומפוזיציה + תאורה + סגנון; גוונו סגנונות — לא תמיד flat vector),
  ו-"alt" בעברית לנגישות — המערכת שומרת את ה-query כפרומפט מומלץ לצד placeholder.`;

const EXAMPLE = {
  title: 'בטיחות במשרד',
  subtitle: 'לומדת מבוא קצרה',
  theme: 'clean',
  chapters: [
    {
      title: 'פתיחה',
      blocks: [
        { type: 'hero', content: { title: 'בטיחות במשרד', subtitle: 'מה כל עובד צריך לדעת' } },
        {
          type: 'richText',
          content: {
            doc: {
              type: 'doc',
              content: [
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'למה זה חשוב' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'סביבת עבודה בטוחה מתחילה במודעות.' }] },
              ],
            },
          },
        },
        {
          type: 'quiz',
          content: {
            question: 'מה עושים כשמזהים סכנה?',
            options: [
              { text: 'מדווחים לממונה', correct: true },
              { text: 'מתעלמים', correct: false },
            ],
          },
        },
      ],
    },
  ],
};

export function buildGenerationContract(): GenerationContract {
  const blocks: BlockContract[] = Object.values(sharedBlockRegistry).map((definition) => ({
    type: definition.type,
    label: definition.label,
    description: definition.description,
    category: definition.category,
    schema: zodToJsonSchema(definition.schema, definition.type),
  }));

  return {
    course: zodToJsonSchema(courseSchema, 'Course'),
    blocks,
    themes: themePresets.map(({ id, name, description }) => ({ id, name, description })),
    richText: { nodes: ALLOWED_NODES, marks: ALLOWED_MARKS },
    guide: GUIDE,
    example: EXAMPLE,
  };
}
