import JSZip from 'jszip';
import type { EmbeddedCourseData } from '@/runtime/readCourseData';
import { FONT_LICENSE, emptyFontBundle, type FontBundle } from '../fonts';
import {
  CONTENT_JSON,
  INDEX_HTML,
  RUNTIME_SCRIPT,
  RUNTIME_STYLES,
  buildIndexHtml,
} from '../indexHtml';
import type { RuntimeBundle } from '../exportZip';
import { SCORM_ADAPTER_FILE, scormAdapterJs } from './adapter';
import { SCORM_MANIFEST_FILE, buildManifest } from './manifest';

/**
 * חבילת SCORM 1.2 להעלאה כפעילות SCORM ב-Moodle.
 *
 * שני הבדלים מהותיים מהייצוא העצמאי:
 *   1. **אין תיקיית שורש** — `imsmanifest.xml` וכל הקבצים יושבים בשורש
 *      ה-ZIP, כי כך מוגדר PIF ש-LMS מייבא.
 *   2. **מתאם SCORM** (`scorm-adapter.js`) נטען לפני חבילת הריצה ומדווח
 *      ל-LMS את אירועי `lc:progress` של הלומדה.
 *
 * שאר החבילה זהה: אותה `buildIndexHtml`, אותה חבילת ריצה, אותם גופנים
 * ונכסים — ולכן הלומדה נראית ומתנהגת בדיוק כמו התוצר העצמאי, גם כשהיא
 * נפתחת לבד מ-`file://` בלי LMS.
 */

export interface ScormZipInput {
  payload: EmbeddedCourseData;
  blobs: Map<string, Blob>;
  runtime: RuntimeBundle;
  fonts?: FontBundle;
}

export async function buildScormZip({
  payload,
  blobs,
  runtime,
  fonts = emptyFontBundle,
}: ScormZipInput): Promise<Blob> {
  const zip = new JSZip();

  // אוספים קודם את כל נתיבי הקבצים, כדי שהמנפסט יוכל לרשום את כולם
  const paths: string[] = [INDEX_HTML, SCORM_ADAPTER_FILE, RUNTIME_SCRIPT, RUNTIME_STYLES, CONTENT_JSON];

  zip.file(INDEX_HTML, buildIndexHtml(payload, { preRuntimeScripts: [SCORM_ADAPTER_FILE] }));
  zip.file(SCORM_ADAPTER_FILE, scormAdapterJs());
  zip.file(RUNTIME_SCRIPT, runtime.appJs);
  zip.file(RUNTIME_STYLES, runtime.stylesCss);
  zip.file(CONTENT_JSON, JSON.stringify(payload, null, 2));

  if (fonts.stylesheets.length > 0) {
    for (const sheet of fonts.stylesheets) {
      zip.file(sheet.path, sheet.content);
      paths.push(sheet.path);
    }
    for (const file of fonts.files) {
      zip.file(file.path, file.blob);
      paths.push(file.path);
    }
    if (fonts.license) {
      zip.file(FONT_LICENSE, fonts.license);
      paths.push(FONT_LICENSE);
    }
  }

  for (const asset of payload.assets) {
    const blob = blobs.get(asset.id);
    // נכס בלי בלוב סונן כבר מה-payload; הבדיקה כאן היא רשת ביטחון אחרונה
    if (blob) {
      zip.file(asset.exportPath, blob);
      paths.push(asset.exportPath);
    }
  }

  // המנפסט נכתב אחרון — הוא צריך את רשימת הנתיבים המלאה, והוא עצמו אינו
  // נרשם כמשאב
  zip.file(SCORM_MANIFEST_FILE, buildManifest(payload.course.title, paths));

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
