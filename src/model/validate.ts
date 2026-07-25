import { type z } from 'zod';
import { migrateProject } from './migrations';
import { projectFileSchema } from './schema';
import type { ProjectFile } from './types';

/**
 * אימות קובץ פרויקט לפני טעינה (סעיף 13.3).
 *
 * המטרה היא הודעה שמשתמש קצה מבין, ולא stack trace: הקובץ נדחה עם הסבר
 * קצר במקום לטעון חלקית ולהשאיר את העורך במצב שבור.
 */

export type ValidationResult =
  | { ok: true; project: ProjectFile; migratedFrom?: string }
  | { ok: false; errors: string[] };

/** הופך שגיאת zod להודעה קריאה בעברית עם ציון המיקום במסמך */
function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path
    .map((part) => (typeof part === 'number' ? `[${part + 1}]` : part))
    .join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

const MAX_REPORTED_ERRORS = 5;

export function validateProjectFile(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['הקובץ אינו קובץ פרויקט תקין.'] };
  }

  const migration = migrateProject(raw as Record<string, unknown>);
  if (!migration.ok) return { ok: false, errors: [migration.error] };

  const parsed = projectFileSchema.safeParse(migration.project);
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, MAX_REPORTED_ERRORS).map(formatIssue);
    if (parsed.error.issues.length > MAX_REPORTED_ERRORS) {
      errors.push(`ועוד ${parsed.error.issues.length - MAX_REPORTED_ERRORS} שגיאות.`);
    }
    return { ok: false, errors };
  }

  const duplicateIds = findDuplicateIds(parsed.data);
  if (duplicateIds.length > 0) {
    return {
      ok: false,
      errors: [`הקובץ מכיל מזהים כפולים: ${duplicateIds.slice(0, 3).join(', ')}`],
    };
  }

  return migration.migratedFrom
    ? { ok: true, project: parsed.data, migratedFrom: migration.migratedFrom }
    : { ok: true, project: parsed.data };
}

/**
 * מזהים כפולים לא נתפסים על ידי הסכמה אבל שוברים בחירה, גרירה ומפתחות
 * React — ולכן נבדקים בנפרד.
 */
export function findDuplicateIds(project: ProjectFile): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  const check = (id: string) => {
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  };

  check(project.course.id);
  for (const chapter of project.course.chapters) {
    check(chapter.id);
    for (const block of chapter.blocks) check(block.id);
  }
  for (const asset of project.assets) check(asset.id);

  return [...duplicates];
}
