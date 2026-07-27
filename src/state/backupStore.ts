import { create } from 'zustand';

/**
 * מעקב אחרי גיבוי לקובץ.
 *
 * השמירה האוטומטית מגִנה על העבודה מפני רענון וסגירת דפדפן — אבל היא חיה
 * ב-IndexedDB, שהוא לפי origin ולפי מכשיר. משתמש שמנקה את נתוני הדפדפן או
 * עובר למחשב אחר בלי להוריד קובץ פרויקט מאבד את הלומדה. ה-store הזה זוכר
 * אם נעשה שינוי מאז הגיבוי האחרון לקובץ (הורדת `.course.zip` או ייצוא
 * לומדה), כדי שנוכל להזכיר לפני יציאה — ורק כשבאמת יש מה לגבות.
 *
 * זהו מצב עורך ולא מסמך, ולכן ב-store נפרד: הוא לא נכנס להיסטוריה ולא
 * לשמירה האוטומטית.
 */
interface BackupState {
  /** האם השתנה משהו במסמך מאז הגיבוי האחרון לקובץ */
  dirtySinceBackup: boolean;
  markDirty: () => void;
  markBackedUp: () => void;
}

export const useBackupStore = create<BackupState>((set) => ({
  dirtySinceBackup: false,
  markDirty: () => set((state) => (state.dirtySinceBackup ? state : { dirtySinceBackup: true })),
  markBackedUp: () => set({ dirtySinceBackup: false }),
}));
