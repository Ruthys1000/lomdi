import { useEffect } from 'react';
import { useCourseStore } from '@/state/courseStore';
import { useBackupStore } from '@/state/backupStore';

/**
 * מזכיר להוריד גיבוי לקובץ לפני יציאה, כשיש שינויים שלא גובו.
 *
 * שתי אחריות:
 *
 * 1. מעקב אחרי שינויים — כל שינוי במסמך מסמן `dirtySinceBackup`. החלפת
 *    לומדה או סגירתה (מזהה שונה) אינה שינוי אלא טעינה, ולכן מאפסת את הדגל
 *    במקום להדליק אותו: לומדה שרק נפתחה עדיין לא "השתנתה מאז הגיבוי".
 *
 * 2. גבול יציאה — כל עוד יש שינוי שלא גובה, `beforeunload` מפעיל את דיאלוג
 *    האישור המובנה של הדפדפן. הוא מותקן רק במצב זה, כדי שרענון של לומדה
 *    שכבר גובתה (או שלא נגעו בה) לא יפריע. הדיאלוג משלים את השמירה
 *    האוטומטית: זו מגִנה מפני איבוד ברענון, וזה מזכיר על גיבוי נייד.
 */
export function useBackupReminder() {
  const dirtySinceBackup = useBackupStore((state) => state.dirtySinceBackup);

  useEffect(() => {
    const { markDirty, markBackedUp } = useBackupStore.getState();
    return useCourseStore.subscribe((state, prev) => {
      // מזהה שהתחלף = טעינה/החלפה/סגירה, לא עריכה
      if (state.course?.id !== prev.course?.id) {
        markBackedUp();
        return;
      }
      if (state.course && prev.course && state.course !== prev.course) {
        markDirty();
      }
    });
  }, []);

  useEffect(() => {
    if (!dirtySinceBackup) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // דפדפנים מודרניים מתעלמים מטקסט מותאם ומציגים הודעה גנרית; העיקר
      // הוא שהדיאלוג בכלל יופיע
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtySinceBackup]);
}
