import { debounce } from '@/lib/debounce';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { useSaveStore } from '@/state/saveStore';
import { PersistenceError, saveProject, setLastProjectId } from './db';
import { buildProjectFile } from './projectFile';

/**
 * השמירה האוטומטית (סעיף 12).
 *
 * היא מאזינה ל-`courseStore` ול-`assetStore` בלבד — ולא ל-`editorStore`.
 * זו בדיוק הסיבה שהמצבים מופרדים מהיום הראשון: בחירת בלוק, פתיחת פאנל
 * ומעבר בין מכשירים אינם שינוי במסמך, ואילו האזנה ל-store מאוחד הייתה
 * גורמת לכל לחיצה על בלוק לכתוב מחדש את כל הפרויקט.
 *
 * נשמרת רק רשומת ה-JSON. הבלובים של הנכסים נכתבים פעם אחת בהעלאה
 * (`AssetLibraryModal`), ולכן שמירה במהלך הקלדה אינה נוגעת במדיה.
 */

const AUTOSAVE_DELAY = 1200;

export async function saveNow(): Promise<boolean> {
  const { course } = useCourseStore.getState();
  if (!course) return false;

  const { markSaving, markSaved, markError } = useSaveStore.getState();
  markSaving();

  try {
    const project = buildProjectFile(course, useAssetStore.getState().assets);
    await saveProject(project);
    await setLastProjectId(course.id);
    markSaved();
    return true;
  } catch (error) {
    markError(
      error instanceof PersistenceError
        ? error.message
        : 'השמירה האוטומטית נכשלה. שמור קובץ פרויקט ידנית.',
    );
    return false;
  }
}

const scheduleSave = debounce(() => void saveNow(), AUTOSAVE_DELAY);

/**
 * מפעיל את השמירה האוטומטית ומחזיר פונקציית ניתוק.
 *
 * `visibilitychange` ולא `beforeunload`: כתיבה ל-IndexedDB היא אסינכרונית,
 * ובזמן `beforeunload` הדפדפן כבר לא מבטיח שהיא תסתיים. מעבר ללשונית אחרת
 * הוא הרגע האחרון שבו עוד אפשר לשמור בוודאות.
 */
export function startAutosave(): () => void {
  const onDocumentChange = () => {
    useSaveStore.getState().markDirty();
    scheduleSave();
  };

  const unsubscribeCourse = useCourseStore.subscribe((state, previous) => {
    if (state.course !== previous.course && state.course) onDocumentChange();
  });

  const unsubscribeAssets = useAssetStore.subscribe((state, previous) => {
    if (state.assets !== previous.assets) onDocumentChange();
  });

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') scheduleSave.flush();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    unsubscribeCourse();
    unsubscribeAssets();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    scheduleSave.cancel();
  };
}

/** מבטל שמירה ממתינה — בשימוש בסגירת פרויקט, כדי שלא תיכתב על החדש */
export function cancelPendingSave(): void {
  scheduleSave.cancel();
}
