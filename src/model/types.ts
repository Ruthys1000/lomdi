/**
 * מודל התוכן של הלומדה.
 *
 * זהו המסמך שנשמר לקובץ הפרויקט ומיוצא לתוצר — ולכן אסור שיכיל
 * שום דבר ששייך למצב העורך (בחירה, viewport, פאנלים פתוחים).
 *
 * הערה: בשלב 1 מוגדרת כאן הליבה המינימלית בלבד. שלב 2 מרחיב אותה
 * (Theme, NavigationSettings, BlockSettings, תוכן לכל סוג בלוק) ומוסיף
 * סכמות zod ב-src/model/schema.ts כמקור האמת.
 */

export const SCHEMA_VERSION = '1.0';

export type Direction = 'rtl' | 'ltr';

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  direction: Direction;
  language: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  blocks: Block[];
}

export interface Block {
  id: string;
  type: string;
  content: unknown;
  settings: BlockSettings;
}

export interface BlockSettings {
  width: 'narrow' | 'normal' | 'wide' | 'full';
  alignment: 'start' | 'center' | 'end';
  background: 'transparent' | 'surface' | 'primary' | 'accent' | 'muted';
  spacingTop: Spacing;
  spacingBottom: Spacing;
}

export type Spacing = 'none' | 'small' | 'medium' | 'large';

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
