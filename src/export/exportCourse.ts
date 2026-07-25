import { downloadBlob } from '@/lib/download';
import { collectAssetBlobs } from '@/persistence/assetBlobs';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { buildCourseZip, exportFileName, exportFolderName } from './exportZip';
import { buildExportPayload } from './payload';
import { ExportError, loadRuntimeBundle } from './runtimeBundle';

/**
 * תזמור הייצוא — הצד היחיד של המנגנון שנוגע ב-stores.
 *
 * הסדר כאן אינו שרירותי: הבלובים נאספים **לפני** בניית ה-payload, כדי
 * שנכס שכתובתו כבר שוחררה יירד גם מרשימת הנכסים המוטמעת ולא רק מהארכיון.
 * אחרת התוצר היה מכיל נתיב תקין לקובץ שאינו שם — תמונה שבורה אצל הלומד
 * במקום בלוק שמציג את עצמו בלי מדיה.
 */

export interface ExportResult {
  fileName: string;
  assetCount: number;
  /** נכסים שהיו אמורים להיארז אבל הקובץ שלהם לא היה זמין */
  missingAssetCount: number;
}

export async function exportCourseZip(date = new Date()): Promise<ExportResult> {
  const { course } = useCourseStore.getState();
  if (!course) throw new ExportError('אין לומדה פתוחה לייצוא.');

  const { assets, urls } = useAssetStore.getState();

  const wanted = buildExportPayload(course, assets).assets;
  const blobs = await collectAssetBlobs(wanted, urls);
  const payload = buildExportPayload(
    course,
    wanted.filter((asset) => blobs.has(asset.id)),
  );

  const runtime = await loadRuntimeBundle();
  const folderName = exportFolderName(course.title, date);
  const zip = await buildCourseZip({ payload, blobs, runtime, folderName, date });

  const fileName = exportFileName(course.title, date);
  downloadBlob(zip, fileName);

  return {
    fileName,
    assetCount: payload.assets.length,
    missingAssetCount: wanted.length - payload.assets.length,
  };
}
