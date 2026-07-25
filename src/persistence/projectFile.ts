import JSZip from 'jszip';
import type { AssetMeta, Course, ProjectFile } from '@/model/types';
import { SCHEMA_VERSION } from '@/model/types';
import { validateProjectFile } from '@/model/validate';
import { APP_NAME, APP_VERSION } from '@/version';

/**
 * קובץ הפרויקט — `.course.zip` (סעיף 13).
 *
 * המבנה:
 *
 *   course.json                        ← ProjectFile מלא
 *   assets/images/asset-a1b2c3d4e5.jpg ← בדיוק לפי AssetMeta.exportPath
 *   assets/videos/asset-f6g7h8i9j0.mp4
 *
 * הנתיבים בתוך הארכיון הם אותם `exportPath` שיהיו בתוצר המיוצא בשלב 7,
 * ולא סכמה מקבילה. כך אין שתי נוסחאות נתיב שיכולות להתפצל, וייצוא לומדה
 * הוא בעיקר החלפת `course.json` ב-`index.html`.
 *
 * ZIP ולא JSON יחיד עם base64: תמונה ב-base64 מתנפחת בשליש, וקובץ פרויקט
 * של 200MB היה הופך למחרוזת שהדפדפן נחנק בפריסתה.
 */

export const COURSE_JSON = 'course.json';
const PROJECT_EXTENSION = '.course.zip';

export function buildProjectFile(course: Course, assets: AssetMeta[]): ProjectFile {
  return {
    version: SCHEMA_VERSION,
    generator: { name: APP_NAME, version: APP_VERSION },
    savedAt: new Date().toISOString(),
    course,
    assets,
  };
}

export async function writeProjectZip(
  project: ProjectFile,
  blobs: Map<string, Blob>,
): Promise<Blob> {
  const zip = new JSZip();

  // רווח בהזחה בכוונה: קובץ פרויקט אמור להיות ניתן לפתיחה ולקריאה בעורך
  // טקסט, גם כדי לאבחן תקלה וגם כדי שההפרש בין שתי גרסאות יהיה קריא
  zip.file(COURSE_JSON, JSON.stringify(project, null, 2));

  for (const asset of project.assets) {
    const blob = blobs.get(asset.id);
    // נכס חסר אינו עוצר את השמירה — עדיף קובץ פרויקט עם תמונה אחת חסרה
    // מאשר לא לתת למשתמש לשמור בכלל
    if (blob) zip.file(asset.exportPath, blob);
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    // מדיה כבר דחוסה; רמה 6 מבזבזת זמן על תמונות ולא חוסכת עליהן דבר
    compressionOptions: { level: 6 },
  });
}

export interface LoadedAsset {
  meta: AssetMeta;
  blob: Blob;
}

export type ReadProjectResult =
  | { ok: true; project: ProjectFile; assets: LoadedAsset[]; warnings: string[] }
  | { ok: false; errors: string[] };

export async function readProjectZip(file: Blob): Promise<ReadProjectResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    return { ok: false, errors: ['הקובץ אינו ארכיון תקין. ודא שנבחר קובץ ‎.course.zip‎ שנוצר במחולל.'] };
  }

  const entry = zip.file(COURSE_JSON);
  if (!entry) {
    return {
      ok: false,
      errors: [`הארכיון אינו מכיל ${COURSE_JSON}, ולכן אינו קובץ פרויקט של המחולל.`],
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await entry.async('string'));
  } catch {
    return { ok: false, errors: [`${COURSE_JSON} פגום ולא ניתן לקריאה.`] };
  }

  const validation = validateProjectFile(raw);
  if (!validation.ok) return validation;

  const warnings: string[] = [];
  if (validation.migratedFrom) {
    warnings.push(`הפרויקט נשמר בגרסה ${validation.migratedFrom} ושודרג לגרסה ${SCHEMA_VERSION}.`);
  }

  const assets: LoadedAsset[] = [];
  for (const meta of validation.project.assets) {
    const assetEntry = zip.file(meta.exportPath);
    if (!assetEntry) {
      // נכס חסר יורד מהרשימה במקום להפיל את הטעינה: הבלוק שמפנה אליו יציג
      // מצב ריק, וכל שאר הלומדה נטענת
      warnings.push(`הקובץ של "${meta.originalName}" חסר בארכיון והנכס לא נטען.`);
      continue;
    }
    const blob = await assetEntry.async('blob');
    assets.push({ meta, blob: blob.type ? blob : new Blob([blob], { type: meta.mimeType }) });
  }

  const project: ProjectFile = { ...validation.project, assets: assets.map((asset) => asset.meta) };
  return { ok: true, project, assets, warnings };
}

/**
 * שם קובץ ההורדה — ASCII בלבד.
 *
 * זה נראה כמו ויתור מיותר בממשק עברי, והוא לא: Chromium משמיט שם קובץ
 * שאינו ASCII במלואו ומוריד במקומו קובץ בשם `download` — **בלי סיומת**.
 * קובץ כזה גם אינו מוצע במסנן `.zip` של חלון פתיחת הקובץ, כלומר המשתמש
 * מקבל קובץ שהוא לא יכול לפתוח בחזרה. נבדק בדפדפן אמיתי.
 *
 * הכותרת בעברית לא הולכת לאיבוד — היא נשמרת בתוך `course.json` ומוצגת
 * שוב ברגע שהפרויקט נפתח. התאריך בשם מבדיל בין הורדות חוזרות.
 */
export function projectFileName(title: string, date = new Date()): string {
  const slug = title
    // כל מה שאינו ASCII נדיר יורד; אותיות לטיניות ומספרים שהמשתמש כתב נשמרים
    .replace(/[^ -~]/g, ' ')
    // התווים ש-Windows, macOS ו-Linux אוסרים בשם קובץ
    .replace(/[/\\:*?"<>|.]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/^-+|-+$/g, '');

  const day = date.toISOString().slice(0, 10);

  return `learnit-${slug ? `${slug}-` : ''}${day}${PROJECT_EXTENSION}`;
}
