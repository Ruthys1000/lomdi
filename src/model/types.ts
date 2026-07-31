/**
 * מודל התוכן של הלומדה.
 *
 * זהו המסמך שנשמר לקובץ הפרויקט ומיוצא לתוצר — ולכן אסור שיכיל שום דבר
 * ששייך למצב העורך (בחירה, viewport, פאנלים פתוחים). ההפרדה הזו נשמרת
 * בקוד על ידי חלוקת ה-stores: courseStore מחזיק את המסמך, editorStore את
 * מצב העורך.
 *
 * שים לב ש-`Block.content` מוגדר כ-`unknown` בכוונה: שכבת המודל לא מכירה
 * את קטלוג הבלוקים. כל בלוק מגדיר את התוכן שלו ואת סכמת ה-zod שלו בתיקייה
 * שלו, וכך הוספת סוג בלוק חדש לא נוגעת בליבה כלל (סעיף 16 באפיון).
 */

export const SCHEMA_VERSION = '1.0';

export type Direction = 'rtl' | 'ltr';

// ─────────────────────────── מבנה הלומדה ───────────────────────────

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  direction: Direction;
  language: string;
  theme: Theme;
  navigation: NavigationSettings;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  blocks: Block[];
}

/**
 * תוכן הבלוק תמיד אובייקט, ולעולם לא ערך פרימיטיבי או חסר.
 * הטיפוס מכוון: `unknown` היה גורם ל-zod לסמן את השדה כאופציונלי,
 * ואז בלוק בלי תוכן כלל היה עובר אימות ומתפוצץ רק בזמן הרינדור.
 */
export type BlockContent = Record<string, unknown>;

export interface Block {
  id: string;
  type: string;
  content: BlockContent;
  settings: BlockSettings;
}

/** עוזר טיפוסים לרכיבים שכן מכירים את סוג התוכן שלהם */
export type BlockOf<C> = Omit<Block, 'content'> & { content: C };

// ─────────────────────────── הגדרות בלוק ───────────────────────────

export type BlockWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type BlockAlignment = 'start' | 'center' | 'end';
export type BlockBackground =
  | 'transparent'
  | 'surface'
  | 'primary'
  | 'accent'
  | 'muted'
  | 'gradient'
  | 'gradientSoft';
export type Spacing = 'none' | 'small' | 'medium' | 'large';

export interface BlockSettings {
  width: BlockWidth;
  /** start/end ולא right/left — כדי שאותו ערך יעבוד ב-RTL וב-LTR */
  alignment: BlockAlignment;
  background: BlockBackground;
  spacingTop: Spacing;
  spacingBottom: Spacing;
}

// ─────────────────────────── עיצוב ───────────────────────────

export type ThemePresetId =
  | 'clean'
  | 'darkElegant'
  | 'vivid'
  | 'warmSand'
  | 'forest'
  | 'highContrast'
  | 'sunset'
  | 'midnight';
export type FontFamilyId = 'system' | 'heebo' | 'assistant' | 'rubik';
export type ShadowLevel = 'none' | 'soft' | 'medium';
export type ButtonStyle = 'solid' | 'soft' | 'outline';
export type CardStyle = 'flat' | 'bordered' | 'elevated';
export type HeadingStyle = 'plain' | 'underline' | 'accentBar';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface Theme {
  preset: ThemePresetId | 'custom';
  colors: ThemeColors;
  typography: {
    fontFamily: FontFamilyId;
    /**
     * גופן נפרד לכותרות — יוצר ניגודיות טיפוגרפית בין כותרת לגוף. ריק/חסר
     * = הכותרות משתמשות ב-fontFamily של הגוף, ולכן ההוספה תואמת אחורה.
     */
    headingFamily?: FontFamilyId;
    baseSize: number;
    headingWeight: 600 | 700 | 800;
    headingStyle: HeadingStyle;
  };
  shape: {
    radius: number;
    shadow: ShadowLevel;
    buttonStyle: ButtonStyle;
    cardStyle: CardStyle;
  };
  layout: {
    contentMaxWidth: number;
    density: Density;
  };
}

// ─────────────────────────── ניווט ───────────────────────────

export type NavigationMode = 'scroll' | 'chapters';

export interface NavigationSettings {
  mode: NavigationMode;
  showProgress: boolean;
  showChapterMenu: boolean;
  showChapterNumber: boolean;
  /**
   * מעקב התקדמות בצד הלומד: חידוש המיקום האחרון, זכירת תשובות ומסך סיום.
   * נשמר ב-localStorage של הדפדפן, ולכן פעיל רק בתוצר ובתצוגה המקדימה.
   */
  trackProgress: boolean;
  labels: {
    next: string;
    prev: string;
    menu: string;
    chapter: string;
  };
}

// ─────────────────────────── נכסים ───────────────────────────

export type AssetKind = 'image' | 'video' | 'file';

export interface AssetMeta {
  id: string;
  /** השם שהמשתמש העלה, לתצוגה בלבד — עשוי להכיל עברית ורווחים */
  originalName: string;
  /** שם ASCII בטוח לכל מערכת קבצים, ZIP ו-Moodle */
  safeName: string;
  kind: AssetKind;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  /** נתיב יחסי בתוך התוצר המיוצא, למשל "assets/images/asset-a1b2c3.jpg" */
  exportPath: string;
}

// ─────────────────────────── קובץ הפרויקט ───────────────────────────

export interface ProjectFile {
  version: string;
  generator: { name: string; version: string };
  savedAt: string;
  course: Course;
  assets: AssetMeta[];
}

// ─────────────────────────── טקסט עשיר ───────────────────────────

/**
 * תוכן טקסט עשיר נשמר כמסמך ProseMirror (JSON) ולא כ-HTML.
 *
 * זו החלטת אבטחה: ה-Renderer ממיר את העץ ל-React דרך רשימה לבנה מפורשת
 * של nodes ו-marks. אין dangerouslySetInnerHTML, אין צורך ב-sanitizer בזמן
 * ריצה, ואי אפשר להזריק HTML דרך קובץ פרויקט זדוני. בונוס: TipTap לא נכנס
 * לחבילת ה-runtime.
 */
export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichTextNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
}

export interface RichTextDoc extends RichTextNode {
  type: 'doc';
}
