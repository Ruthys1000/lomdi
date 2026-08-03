/**
 * קטלוג הפורמטים — הצד הלקוחי של הפיבוט.
 *
 * פורמט הוא "סוג חוויית הלמידה" שהמשתמש בוחר מראש (One Pager, Process,
 * Checklist…). זהו מקור האמת עבור:
 *   1. גלריית הבחירה במסך הפתיחה (label, tagline, preview).
 *   2. אילוצי העורך — אילו בלוקים מותרים (`allowedBlockTypes`) והאם מותר
 *      לפצל לפרקים (`allowChapters`).
 *   3. רמז הקלט המותאם בטופס היצירה (`entryPlaceholder`).
 *
 * ה"אישיות" של הפורמט בצד ה-AI (role/interview/skeleton/example) חיה בנפרד
 * ב-`api/formats.ts`, כי פונקציות ה-serverless לא יכולות לייבא מ-`src/`.
 * שני החצאים מסונכרנים ידנית — בדיוק כמו קטלוג הבלוקים היום.
 *
 * שכבת המודל אגנוסטית לקטלוג הזה: `Course.format` הוא מחרוזת חופשית, בדיוק
 * כמו `Block.type`. פורמט לא מוכר (או חסר) = לומדת legacy בלי אילוצים.
 */

export type FormatId =
  | 'onePager'
  | 'process'
  | 'checklist'
  | 'scenario'
  | 'challenge'
  | 'caseStudy';

/** אבן בניין סכמטית ב-preview של הפורמט בגלריה */
export type FormatPreviewBlock =
  | 'hero'
  | 'text'
  | 'cards'
  | 'callout'
  | 'steps'
  | 'checklist'
  | 'quote'
  | 'image'
  | 'decision'
  | 'challenge';

export interface FormatDefinition {
  id: FormatId;
  /** שם קצר בעברית — הכותרת בכרטיס הגלריה */
  label: string;
  /** משפט אחד שממחיש למה משמש הפורמט */
  tagline: string;
  /** תיאור מלא יותר, מוצג בכרטיס */
  description: string;
  /**
   * 'ready' — נבנה ומופעל. 'soon' — מופיע בגלריה מושבת, כדי לתקשר את
   * מפת הדרכים בלי להטעות (אותו דפוס כמו הבלוקים "בקרוב").
   */
  status: 'ready' | 'soon';
  /** סוגי הבלוקים שמותר להוסיף בפורמט זה. מסנן את ספריית הבלוקים. */
  allowedBlockTypes: string[];
  /** האם מותר לפצל את הלומדה לכמה פרקים */
  allowChapters: boolean;
  /** מצב ניווט ברירת מחדל ללומדה בפורמט זה */
  defaultNavigation: 'scroll' | 'chapters';
  /** רמז הקלט בטופס היצירה — מנוסח לפי סוג התוכן שהפורמט מצפה לו */
  entryPlaceholder: string;
  /** שלד סכמטי שמצויר בכרטיס הגלריה כדי להמחיש את המבנה */
  preview: FormatPreviewBlock[];
}

/**
 * הבלוקים המשותפים לרוב הפורמטים. callout מצטרף כמעט לכולם כי הוא ה"מסר
 * המרכזי" האוניברסלי.
 */
const SHARED_STRUCTURE = ['hero', 'richText', 'divider'];

export const formatRegistry: Record<FormatId, FormatDefinition> = {
  onePager: {
    id: 'onePager',
    label: 'One Pager',
    tagline: 'עמוד אחד סרוק וברור — המסר המרכזי במבט אחד.',
    description:
      'מזקק תוכן ארוך לעמוד יחיד: כותרת, תמצית, נקודות מפתח והמסר לקחת הביתה. בלי פרקים, בלי ניווט — הכול נגלל.',
    status: 'ready',
    allowedBlockTypes: [...SHARED_STRUCTURE, 'cards', 'callout', 'quote', 'image'],
    allowChapters: false,
    defaultNavigation: 'scroll',
    entryPlaceholder:
      'הדביקו כאן תוכן — מאמר, סיכום, מסמך — ונבנה ממנו One Pager סרוק וברור…',
    preview: ['hero', 'text', 'cards', 'callout'],
  },
  process: {
    id: 'process',
    label: 'Process',
    tagline: 'נוהל או תהליך, מפורק לשלבים ברורים לפי הסדר.',
    description:
      'הופך נוהל, תהליך עבודה או מדריך הפעלה לרצף שלבים ממוספרים — כל שלב עם הפעולה, מי מבצע והתוצאה.',
    status: 'ready',
    allowedBlockTypes: [...SHARED_STRUCTURE, 'steps', 'callout', 'image'],
    allowChapters: false,
    defaultNavigation: 'scroll',
    entryPlaceholder:
      'הדביקו כאן נוהל או תהליך — ונפרק אותו לשלבים ברורים לפי הסדר…',
    preview: ['hero', 'text', 'steps', 'callout'],
  },
  checklist: {
    id: 'checklist',
    label: 'Checklist',
    tagline: 'רשימת פעולות לאימות — לפני, אחרי, או תוך כדי.',
    description: 'רשימת פריטים ניתנים-לסימון: ציות, בקרת איכות, "לפני שמתחילים". מגיע בהמשך.',
    status: 'soon',
    allowedBlockTypes: [...SHARED_STRUCTURE, 'checklist', 'callout'],
    allowChapters: false,
    defaultNavigation: 'scroll',
    entryPlaceholder: 'הדביקו כאן את שלבי הבדיקה או הדרישות — ונבנה מהם צ׳ק-ליסט…',
    preview: ['hero', 'checklist', 'callout'],
  },
  scenario: {
    id: 'scenario',
    label: 'Scenario',
    tagline: 'מצב מהשטח, החלטה, והשלכה — למידה מתוך התנסות.',
    description: 'תרחיש ליניארי: מצב ריאלי, נקודת החלטה, ומשוב לכל בחירה. מגיע בהמשך.',
    status: 'soon',
    allowedBlockTypes: [...SHARED_STRUCTURE, 'image', 'decision', 'callout'],
    allowChapters: true,
    defaultNavigation: 'scroll',
    entryPlaceholder: 'הדביקו כאן מקרה או מצב מהשטח — ונבנה ממנו תרחיש החלטה…',
    preview: ['hero', 'text', 'decision', 'callout'],
  },
  challenge: {
    id: 'challenge',
    label: 'Challenge',
    tagline: 'בחן את עצמך — סדרת שאלות עם ציון ומשוב.',
    description: 'מיני-הערכה: סדרת שאלות עם הסבר לכל תשובה, ציון בסוף ומשוב מעבר/כישלון. מגיע בהמשך.',
    status: 'soon',
    allowedBlockTypes: [...SHARED_STRUCTURE, 'challenge'],
    allowChapters: false,
    defaultNavigation: 'scroll',
    entryPlaceholder: 'הדביקו כאן חומר לבחינה — ונבנה ממנו אתגר "בחן את עצמך"…',
    preview: ['hero', 'text', 'challenge'],
  },
  caseStudy: {
    id: 'caseStudy',
    label: 'Case Study',
    tagline: 'רקע, אתגר, מה נעשה, תוצאות ולקחים.',
    description: 'ניתוח מקרה נרטיבי לפי שלד קבוע: הקשר, האתגר, הפעולה, התוצאות והלקחים. מגיע בהמשך.',
    status: 'soon',
    allowedBlockTypes: [...SHARED_STRUCTURE, 'textImage', 'quote', 'callout', 'cards'],
    allowChapters: true,
    defaultNavigation: 'chapters',
    entryPlaceholder: 'הדביקו כאן את המקרה — ונבנה ממנו Case Study מובנה…',
    preview: ['hero', 'text', 'quote', 'callout'],
  },
};

export const formatIds = Object.keys(formatRegistry) as FormatId[];

/** כל הפורמטים לפי סדר התצוגה בגלריה — ה-ready קודם, ה-soon אחריהם */
export const formatList: FormatDefinition[] = [
  ...formatIds.map((id) => formatRegistry[id]).filter((f) => f.status === 'ready'),
  ...formatIds.map((id) => formatRegistry[id]).filter((f) => f.status === 'soon'),
];

export function getFormat(id: string | undefined): FormatDefinition | undefined {
  if (!id) return undefined;
  return formatRegistry[id as FormatId];
}

/**
 * סוגי הבלוקים המותרים ללומדה בפורמט נתון. פורמט לא מוכר או חסר (legacy)
 * מחזיר `undefined` — הקורא מפרש זאת כ"הכול מותר", כמו לפני הפיבוט.
 */
export function allowedBlockTypesFor(formatId: string | undefined): string[] | undefined {
  return getFormat(formatId)?.allowedBlockTypes;
}
