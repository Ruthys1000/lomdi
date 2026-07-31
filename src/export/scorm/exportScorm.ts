import { downloadBlob } from '@/lib/download';
import { datedFileName } from '@/lib/fileName';
import { collectAssetBlobs } from '@/persistence/assetBlobs';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { loadFontBundle } from '../fonts';
import { buildExportPayload } from '../payload';
import { ExportError, loadRuntimeBundle } from '../runtimeBundle';
import { buildScormZip } from './scormZip';

/**
 * תזמור ייצוא ה-SCORM — מקביל ל-`exportCourse.ts`, עם אותו סדר איסוף
 * בלובים לפני בניית ה-payload: נכס שכתובתו שוחררה יורד גם מהרשימה המוטמעת
 * וגם מהארכיון, כדי שלא ייווצר נתיב לקובץ שאינו שם.
 */

export interface ScormExportResult {
  fileName: string;
  assetCount: number;
  missingAssetCount: number;
}

export function scormFileName(title: string, date = new Date()): string {
  return datedFileName(title, '-scorm.zip', date);
}

export async function exportScormZip(date = new Date()): Promise<ScormExportResult> {
  const { course } = useCourseStore.getState();
  if (!course) throw new ExportError('אין לומדה פתוחה לייצוא.');

  const { assets, urls } = useAssetStore.getState();

  const wanted = buildExportPayload(course, assets).assets;
  const blobs = await collectAssetBlobs(wanted, urls);
  const payload = buildExportPayload(
    course,
    wanted.filter((asset) => blobs.has(asset.id)),
  );

  const [runtime, fonts] = await Promise.all([loadRuntimeBundle(), loadFontBundle(course.theme)]);

  const zip = await buildScormZip({ payload, blobs, runtime, fonts });

  const fileName = scormFileName(course.title, date);
  downloadBlob(zip, fileName);

  return {
    fileName,
    assetCount: payload.assets.length,
    missingAssetCount: wanted.length - payload.assets.length,
  };
}
