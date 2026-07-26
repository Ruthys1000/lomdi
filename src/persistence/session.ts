import { downloadBlob } from '@/lib/download';
import type { TemplateAsset } from '@/sample/illustrations';
import type { Course } from '@/model/types';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { useSaveStore } from '@/state/saveStore';
import { collectAssetBlobs } from './assetBlobs';
import { cancelPendingSave, saveNow } from './autosave';
import { loadProject, loadProjectAssets, putAsset, setLastProjectId } from './db';
import {
  buildProjectFile,
  projectFileName,
  readProjectZip,
  writeProjectZip,
  type ReadProjectResult,
} from './projectFile';

/**
 * מחזור החיים של פרויקט: פתיחה, החלפה, שמירה לקובץ.
 *
 * המקום היחיד שבו שלושת ה-stores מתעדכנים יחד. ריכוז כאן ולא ברכיבים
 * מונע את הבאג שקל ליפול בו: טעינת לומדה בלי לאפס את הנכסים משאירה את
 * התמונות של הפרויקט הקודם, והבלוקים החדשים מציגים מדיה זרה.
 */

function resetSession() {
  cancelPendingSave();
  useAssetStore.getState().clear();
  useEditorStore.getState().reset();
  useSaveStore.getState().reset();
}

/**
 * חזרה למסך הפתיחה מתוך העורך.
 *
 * שוטף שמירה תלויה ל-IndexedDB לפני האיפוס, כך שהחזרה אינה מאבדת עבודה
 * והלומדה חוזרת כ"המשך מהמקום שבו הפסקת" (saveNow מעדכן גם את lastProjectId).
 * אם השמירה נכשלת (אחסון חסום) — לא מאפסים, ומחזירים false כדי שהקורא
 * יוכל להזהיר לפני איבוד שינויים.
 */
export async function closeToWelcome(): Promise<boolean> {
  const { course } = useCourseStore.getState();
  if (!course) return true;

  const saved = await saveNow();
  if (!saved) return false;

  forceCloseToWelcome();
  return true;
}

/** איפוס וחזרה למסך הפתיחה בלי לשמור — רק אחרי שהמשתמש אישר איבוד שינויים. */
export function forceCloseToWelcome(): void {
  resetSession();
  useCourseStore.getState().closeCourse();
}

/**
 * פתיחת לומדה חדשה מתבנית.
 *
 * ה-`saveNow` בסוף אינו ייעול אלא תיקון: השמירה האוטומטית נרשמת ב-
 * `EditorLayout`, כלומר *אחרי* שהלומדה כבר נטענה ל-store, והיא מאזינה
 * לשינויים בלבד. בלי כתיבה מפורשת כאן, לומדה שנוצרה מתבנית ולא נערכה
 * מעולם אינה קיימת באחסון — רענון מחק אותה, והיא לא הופיעה ב"המשך
 * מהמקום שבו הפסקת". `openProjectFile` כבר עשה את זה; רק המסלול הזה פוספס.
 */
export async function openCourse(course: Course, assets: TemplateAsset[] = []): Promise<void> {
  resetSession();

  // אותו סדר כמו ב-openProjectFile: הבלובים נכתבים ל-IndexedDB לפני
  // שהלומדה נטענת ל-state, כדי שרענון מיד אחרי היצירה יחזיר לומדה שלמה
  // ולא בלוקים שמפנים לאיורים שאינם קיימים
  for (const { meta, blob } of assets) {
    await putAsset(course.id, meta, blob);
  }
  useAssetStore.getState().loadAssets(assets);

  useCourseStore.getState().loadCourse(course);
  useEditorStore.getState().selectChapter(course.chapters[0]?.id ?? null);
  await saveNow();
}

export type OpenResult = { ok: true } | { ok: false; errors: string[] };

/** המשך עבודה על פרויקט ששמור ב-IndexedDB */
export async function openStoredProject(projectId: string): Promise<OpenResult> {
  const stored = await loadProject(projectId);
  if (!stored) return { ok: false, errors: ['הפרויקט לא נמצא באחסון המקומי.'] };

  const assets = await loadProjectAssets(projectId);

  resetSession();
  useAssetStore.getState().loadAssets(assets.map(({ meta, blob }) => ({ meta, blob })));
  useCourseStore.getState().loadCourse(stored.course);
  useEditorStore.getState().selectChapter(stored.course.chapters[0]?.id ?? null);
  await setLastProjectId(projectId);

  return { ok: true };
}

export interface ImportedProject {
  warnings: string[];
}

/**
 * ייבוא קובץ `.course.zip`.
 *
 * הנכסים נכתבים ל-IndexedDB לפני שהלומדה נטענת ל-state, כדי שרענון מיד
 * אחרי הייבוא יחזיר פרויקט שלם ולא לומדה שמפנה לתמונות שאינן קיימות.
 */
export async function openProjectFile(file: Blob): Promise<ReadProjectResult> {
  const result = await readProjectZip(file);
  if (!result.ok) return result;

  const { project, assets } = result;

  resetSession();
  for (const { meta, blob } of assets) {
    await putAsset(project.course.id, meta, blob);
  }

  useAssetStore.getState().loadAssets(assets);
  useCourseStore.getState().loadCourse(project.course);
  useEditorStore.getState().selectChapter(project.course.chapters[0]?.id ?? null);
  await saveNow();

  return result;
}

/** הורדת קובץ הפרויקט. אוסף את הבלובים מה-object URLs שכבר קיימים בזיכרון. */
export async function downloadProjectFile(): Promise<void> {
  const { course } = useCourseStore.getState();
  if (!course) return;

  const { assets, urls } = useAssetStore.getState();
  const blobs = await collectAssetBlobs(assets, urls);

  const project = buildProjectFile(course, assets);
  const zip = await writeProjectZip(project, blobs);

  downloadBlob(zip, projectFileName(course.title));
}
