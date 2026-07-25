import { SCHEMA_VERSION } from './types';

/**
 * שדרוג קבצי פרויקט מגרסאות קודמות.
 *
 * הרשימה ריקה כרגע — יש רק גרסה אחת. היא קיימת מהיום הראשון בכוונה: ברגע
 * שיישמר אצל משתמש קובץ בגרסה 1.0, כל שינוי עתידי במבנה חייב נתיב שדרוג,
 * ואת התשתית לזה קשה להוסיף בדיעבד.
 */

type MigrationStep = (project: Record<string, unknown>) => Record<string, unknown>;

/** ממופה לפי הגרסה שממנה משדרגים, למשל '1.0' → מבנה 1.1 */
const migrations: Record<string, MigrationStep> = {};

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

export type MigrationResult =
  | { ok: true; project: Record<string, unknown>; migratedFrom?: string }
  | { ok: false; error: string };

export function migrateProject(raw: Record<string, unknown>): MigrationResult {
  const version = typeof raw.version === 'string' ? raw.version : null;

  if (!version) {
    return { ok: false, error: 'הקובץ אינו כולל מספר גרסה ולכן לא ניתן לטעון אותו.' };
  }

  if (compareVersions(version, SCHEMA_VERSION) > 0) {
    return {
      ok: false,
      error: `הקובץ נשמר בגרסה ${version}, חדשה יותר מהגרסה שהמערכת תומכת בה (${SCHEMA_VERSION}). עדכן את המחולל.`,
    };
  }

  let project = raw;
  let current = version;
  const from = version;

  while (compareVersions(current, SCHEMA_VERSION) < 0) {
    const step = migrations[current];
    if (!step) {
      return { ok: false, error: `אין נתיב שדרוג מגרסה ${current} לגרסה ${SCHEMA_VERSION}.` };
    }
    project = step(project);
    const next = project.version;
    if (typeof next !== 'string' || compareVersions(next, current) <= 0) {
      return { ok: false, error: 'שדרוג הקובץ נכשל.' };
    }
    current = next;
  }

  return from === SCHEMA_VERSION ? { ok: true, project } : { ok: true, project, migratedFrom: from };
}
