import JSZip from 'jszip';
import { datedFileName } from '@/lib/fileName';
import type { EmbeddedCourseData } from '@/runtime/readCourseData';
import { APP_NAME, APP_VERSION } from '@/version';
import {
  CONTENT_JSON,
  INDEX_HTML,
  RUNTIME_SCRIPT,
  RUNTIME_STYLES,
  buildIndexHtml,
} from './indexHtml';

/**
 * ה-ZIP של הלומדה העצמאית (שלב 7).
 *
 * המבנה — הכול תחת תיקיית שורש אחת:
 *
 *   learnit-safety-2026-07-25/
 *     index.html
 *     content.json
 *     runtime/app.js
 *     runtime/styles.css
 *     assets/images/asset-a1b2c3d4e5.jpg   ← בדיוק לפי AssetMeta.exportPath
 *     README.txt
 *
 * תיקיית שורש ולא קבצים חשופים: פריקה לתוך תיקיית ההורדות לא מפזרת חמישה
 * פריטים בין הקבצים של המשתמש, וב-Moodle התיקייה עולה כיחידה אחת.
 *
 * נתיבי הנכסים הם אותם `exportPath` שכבר בשימוש בקובץ הפרויקט, ולא סכמה
 * מקבילה — הרנדרר מקבל אותם מ-`resolveAssetUrl` ואינו יודע כלל שהוא רץ
 * בתוצר.
 */

export interface RuntimeBundle {
  appJs: string;
  stylesCss: string;
}

export interface CourseZipInput {
  payload: EmbeddedCourseData;
  /** הבלובים של הנכסים שברשימת ה-payload, לפי מזהה */
  blobs: Map<string, Blob>;
  runtime: RuntimeBundle;
  folderName: string;
  date?: Date;
}

/** שם ההורדה ושם תיקיית השורש — אותה נוסחת ASCII של קובץ הפרויקט */
export function exportFolderName(title: string, date = new Date()): string {
  return datedFileName(title, '', date);
}

export function exportFileName(title: string, date = new Date()): string {
  return datedFileName(title, '.zip', date);
}

/**
 * הוראות ההפעלה שנארזות לצד הלומדה.
 *
 * BOM ושורות CRLF בכוונה: זהו הקובץ היחיד בארכיון שנפתח ב-Notepad של
 * Windows, וקובץ עברי בלי BOM נפתח שם כג'יבריש.
 */
function readmeText(payload: EmbeddedCourseData, date: Date): string {
  const lines = [
    `לומדת ${APP_NAME}: ${payload.course.title}`,
    '',
    'הפעלה',
    '  פותחים את index.html בדאבל-קליק. אין צורך בשרת, בהתקנה או בחיבור לאינטרנט.',
    '',
    'מה אסור למחוק',
    '  התיקיות runtime ו-assets חייבות להישאר לצד index.html. בלעדיהן הלומדה לא תעלה.',
    '',
    'העלאה ל-Moodle',
    '  מעלים את התיקייה כולה (או את קובץ ה-ZIP) כמשאב מסוג "תיקייה" או "קובץ",',
    '  ומגדירים את index.html כקובץ הראשי.',
    '',
    'שימו לב',
    '  סרטוני יוטיוב או Vimeo, אם יש בלומדה, נטענים מהאינטרנט ודורשים חיבור.',
    '',
    `נוצר ב-${date.toISOString().slice(0, 10)} על ידי ${APP_NAME} ${APP_VERSION}.`,
  ];

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export async function buildCourseZip({
  payload,
  blobs,
  runtime,
  folderName,
  date = new Date(),
}: CourseZipInput): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder(folderName);
  if (!root) throw new Error(`לא ניתן ליצור את תיקיית "${folderName}" בארכיון.`);

  root.file(INDEX_HTML, buildIndexHtml(payload));
  root.file(RUNTIME_SCRIPT, runtime.appJs);
  root.file(RUNTIME_STYLES, runtime.stylesCss);

  // אותו payload שמוטמע ב-HTML. משמש כגיבוי כשהתיקייה מוגשת משרת, ולכן
  // הוא חייב להיות אותו אובייקט בדיוק ולא בנייה שנייה שיכולה להתפצל.
  root.file(CONTENT_JSON, JSON.stringify(payload, null, 2));
  root.file('README.txt', readmeText(payload, date));

  for (const asset of payload.assets) {
    const blob = blobs.get(asset.id);
    // נכס בלי בלוב לא אמור להגיע לכאן — הקורא מסנן אותו מה-payload לפני
    // הבנייה, כדי שלא ייווצר נתיב שמצביע לקובץ שאינו בארכיון
    if (blob) root.file(asset.exportPath, blob);
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    // מדיה כבר דחוסה; רמה גבוהה מבזבזת זמן על תמונות ולא חוסכת עליהן דבר
    compressionOptions: { level: 6 },
  });
}
