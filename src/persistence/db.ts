import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AssetMeta, Course, ProjectFile } from '@/model/types';

/**
 * שכבת ה-IndexedDB (סעיף 12).
 *
 * שלוש החנויות מפרידות בין מה שנכתב הרבה למה שנכתב פעם אחת: רשומת
 * `projects` היא JSON קטן שנכתב בכל שמירה אוטומטית, ואילו הבלובים ב-
 * `assets` נכתבים פעם אחת בהעלאה ואינם נוגעים בשמירה. בלי ההפרדה הזו כל
 * הקלדה הייתה מעתיקה מחדש עשרות מגה-בייט של תמונות.
 *
 * הנכסים נשמרים עם `projectId` ולא בתוך רשומת הפרויקט, כדי שאפשר יהיה
 * לטעון את רשימת הפרויקטים למסך הפתיחה בלי לשלוף איתה את כל המדיה.
 */

/*
 * שם המסד נשאר 'learnit' אף שהמוצר נקרא "לומדי".
 *
 * שינוי השם פותח מסד *חדש וריק*: IndexedDB ממופתח בשם, ואין מנגנון שמעביר
 * רשומות ממסד אחד לשני. כל לומדה ששמורה בדפדפן של מישהו הייתה נעלמת
 * מ"הלומדות שלי" בלי שום הודעה — אובדן עבודה בשביל אסתטיקה של מחרוזת
 * שהמשתמש לעולם אינו רואה.
 */
const DB_NAME = 'learnit';
const DB_VERSION = 1;

export interface StoredProject {
  id: string;
  title: string;
  savedAt: string;
  version: string;
  course: Course;
  assets: AssetMeta[];
}

export interface StoredAsset {
  id: string;
  projectId: string;
  meta: AssetMeta;
  blob: Blob;
}

export interface ProjectSummary {
  id: string;
  title: string;
  savedAt: string;
  chapterCount: number;
  blockCount: number;
}

interface LomdiDb extends DBSchema {
  projects: {
    key: string;
    value: StoredProject;
    indexes: { savedAt: string };
  };
  assets: {
    key: string;
    value: StoredAsset;
    indexes: { projectId: string };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

/**
 * כשל התמדה שהמשתמש אמור לראות.
 *
 * גלישה פרטית, מכסה מלאה ודפדפן שחוסם אחסון נכשלים כולם באותו מקום, והם
 * לא באג שצריך להפיל את העורך — הם מצב שצריך להציג בו הודעה ולהמשיך
 * לעבוד בזיכרון.
 */
export class PersistenceError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

let dbPromise: Promise<IDBPDatabase<LomdiDb>> | null = null;

function connect(): Promise<IDBPDatabase<LomdiDb>> {
  if (!dbPromise) {
    // עטיפה ב-async: בדפדפן שחוסם אחסון `openDB` זורק סינכרונית, וזריקה
    // כזו הייתה עוקפת את ה-catch שלמטה ומגיעה לממשק בלי ההודעה הנכונה
    dbPromise = (async () =>
      openDB<LomdiDb>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('projects')) {
            const projects = db.createObjectStore('projects', { keyPath: 'id' });
            projects.createIndex('savedAt', 'savedAt');
          }
          if (!db.objectStoreNames.contains('assets')) {
            const assets = db.createObjectStore('assets', { keyPath: 'id' });
            assets.createIndex('projectId', 'projectId');
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta');
          }
        },
        blocking() {
          // לשונית אחרת מבקשת לשדרג את הסכמה. סגירה כאן מונעת ממנה להיתקע.
          void dbPromise?.then((db) => db.close());
          dbPromise = null;
        },
      }))().catch((error) => {
      dbPromise = null;
      throw new PersistenceError(
        'הדפדפן חוסם אחסון מקומי, ולכן לא ניתן לשמור אוטומטית. שמור קובץ פרויקט ידנית.',
        error,
      );
    });
  }
  return dbPromise;
}

/** עוטף כל גישה, כדי שכשל מכסה יגיע לממשק כהודעה ולא כ-Promise דחוי אנונימי */
async function withDb<T>(fn: (db: IDBPDatabase<LomdiDb>) => Promise<T>, action: string): Promise<T> {
  try {
    return await fn(await connect());
  } catch (error) {
    if (error instanceof PersistenceError) throw error;
    const quota = error instanceof DOMException && error.name === 'QuotaExceededError';
    throw new PersistenceError(
      quota
        ? 'נגמר מקום האחסון בדפדפן. מחק פרויקטים ישנים או נכסים שאינם בשימוש.'
        : `${action} נכשלה.`,
      error,
    );
  }
}

/** לשימוש בבדיקות בלבד — מאפס את החיבור בין מקרי בדיקה */
export function resetDbConnection(): void {
  void dbPromise?.then((db) => db.close()).catch(() => undefined);
  dbPromise = null;
}

// ─────────────────────────── פרויקטים ───────────────────────────

export async function saveProject(project: ProjectFile): Promise<void> {
  await withDb(
    (db) =>
      db.put('projects', {
        id: project.course.id,
        title: project.course.title,
        savedAt: project.savedAt,
        version: project.version,
        course: project.course,
        assets: project.assets,
      }),
    'שמירת הפרויקט',
  );
}

export async function loadProject(id: string): Promise<StoredProject | undefined> {
  return withDb((db) => db.get('projects', id), 'טעינת הפרויקט');
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const stored = await withDb((db) => db.getAllFromIndex('projects', 'savedAt'), 'טעינת רשימת הפרויקטים');

  // האינדקס מחזיר בסדר עולה; המסך רוצה את האחרון שנשמר קודם
  return stored.reverse().map((project) => ({
    id: project.id,
    title: project.title,
    savedAt: project.savedAt,
    chapterCount: project.course.chapters.length,
    blockCount: project.course.chapters.reduce((sum, chapter) => sum + chapter.blocks.length, 0),
  }));
}

export async function deleteProject(id: string): Promise<void> {
  await withDb(async (db) => {
    // עסקה אחת על שתי החנויות: פרויקט בלי הנכסים שלו היה משאיר בלובים
    // יתומים שתופסים מקום ואינם נגישים משום מסך
    const tx = db.transaction(['projects', 'assets'], 'readwrite');
    const assetIds = await tx.objectStore('assets').index('projectId').getAllKeys(id);
    await Promise.all([
      tx.objectStore('projects').delete(id),
      ...assetIds.map((key) => tx.objectStore('assets').delete(key)),
    ]);
    await tx.done;
  }, 'מחיקת הפרויקט');
}

// ─────────────────────────── נכסים ───────────────────────────

export async function putAsset(projectId: string, meta: AssetMeta, blob: Blob): Promise<void> {
  await withDb((db) => db.put('assets', { id: meta.id, projectId, meta, blob }), 'שמירת הנכס');
}

export async function loadProjectAssets(projectId: string): Promise<StoredAsset[]> {
  return withDb((db) => db.getAllFromIndex('assets', 'projectId', projectId), 'טעינת הנכסים');
}

export async function deleteAsset(id: string): Promise<void> {
  await withDb((db) => db.delete('assets', id), 'מחיקת הנכס');
}

// ─────────────────────────── מצב אחרון ───────────────────────────

export async function setLastProjectId(id: string | null): Promise<void> {
  await withDb(async (db) => {
    if (id) await db.put('meta', id, 'lastProjectId');
    else await db.delete('meta', 'lastProjectId');
  }, 'שמירת הפרויקט האחרון');
}

export async function getLastProjectId(): Promise<string | null> {
  const value = await withDb((db) => db.get('meta', 'lastProjectId'), 'קריאת הפרויקט האחרון');
  return typeof value === 'string' ? value : null;
}
