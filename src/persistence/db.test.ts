import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { Blob as NodeBlob } from 'node:buffer';
import { beforeEach, describe, expect, it } from 'vitest';
import { createCourse } from '@/model/factory';
import { blobBytes } from '@/test/blob';
import type { AssetMeta, ProjectFile } from '@/model/types';
import { SCHEMA_VERSION } from '@/model/types';
import {
  deleteAsset,
  deleteProject,
  getLastProjectId,
  listProjects,
  loadProject,
  loadProjectAssets,
  putAsset,
  resetDbConnection,
  saveProject,
  setLastProjectId,
} from './db';

const asset = (id: string): AssetMeta => ({
  id,
  originalName: 'תמונה.png',
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size: 4,
  exportPath: `assets/images/${id}.png`,
});

/**
 * fake-indexeddb משכפל ערכים דרך `structuredClone` של Node, שאינו מכיר את
 * ה-Blob של jsdom ומשטח אותו לאובייקט ריק. ה-Blob של Node עובר את השכפול
 * כמו שהוא, ולכן הבדיקה בונה איתו — בדפדפן אמיתי אין הבדל בין השניים.
 */
const testBlob = (data: Uint8Array | string, type = 'image/png'): Blob =>
  new NodeBlob([data], { type }) as unknown as Blob;

const projectFile = (title: string, savedAt: string, assets: AssetMeta[] = []): ProjectFile => ({
  version: SCHEMA_VERSION,
  generator: { name: 'LearnIt', version: '0.1.0' },
  savedAt,
  course: createCourse({ title }),
  assets,
});

beforeEach(() => {
  // בסיס נתונים נקי לכל מקרה בדיקה — אחרת רשימת הפרויקטים מצטברת ביניהם
  resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
});

describe('אחסון פרויקטים', () => {
  it('שומר וטוען פרויקט שלם', async () => {
    const project = projectFile('לומדת בטיחות', '2026-01-01T10:00:00.000Z');
    await saveProject(project);

    const loaded = await loadProject(project.course.id);

    expect(loaded?.title).toBe('לומדת בטיחות');
    expect(loaded?.course.chapters).toHaveLength(1);
    expect(loaded?.savedAt).toBe('2026-01-01T10:00:00.000Z');
  });

  it('דורס את הרשומה הקודמת ולא מוסיף עותק', async () => {
    const project = projectFile('גרסה א', '2026-01-01T10:00:00.000Z');
    await saveProject(project);
    await saveProject({ ...project, course: { ...project.course, title: 'גרסה ב' } });

    expect(await listProjects()).toHaveLength(1);
    expect((await loadProject(project.course.id))?.title).toBe('גרסה ב');
  });

  it('מחזיר את רשימת האחרונים ממוינת מהחדש לישן', async () => {
    await saveProject(projectFile('ישן', '2026-01-01T10:00:00.000Z'));
    await saveProject(projectFile('חדש', '2026-03-01T10:00:00.000Z'));
    await saveProject(projectFile('אמצע', '2026-02-01T10:00:00.000Z'));

    expect((await listProjects()).map((project) => project.title)).toEqual([
      'חדש',
      'אמצע',
      'ישן',
    ]);
  });

  it('מונה פרקים ובלוקים לתצוגה במסך הפתיחה', async () => {
    const project = projectFile('לומדה', '2026-01-01T10:00:00.000Z');
    await saveProject(project);

    const [summary] = await listProjects();
    expect(summary.chapterCount).toBe(1);
    expect(summary.blockCount).toBe(0);
  });

  it('מחזיר undefined לפרויקט שאינו קיים', async () => {
    expect(await loadProject('course-missing')).toBeUndefined();
  });
});

describe('אחסון נכסים', () => {
  it('שומר Blob ומחזיר את הבתים כפי שהם', async () => {
    const blob = testBlob(new Uint8Array([1, 2, 3, 4]));
    await putAsset('course-1', asset('asset-a'), blob);

    const [stored] = await loadProjectAssets('course-1');

    expect(stored.meta.originalName).toBe('תמונה.png');
    expect(await blobBytes(stored.blob)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('מפריד נכסים לפי פרויקט', async () => {
    await putAsset('course-1', asset('asset-a'), testBlob('a'));
    await putAsset('course-2', asset('asset-b'), testBlob('b'));

    expect(await loadProjectAssets('course-1')).toHaveLength(1);
    expect((await loadProjectAssets('course-2'))[0].meta.id).toBe('asset-b');
  });

  it('מוחק נכס בודד', async () => {
    await putAsset('course-1', asset('asset-a'), testBlob('a'));
    await deleteAsset('asset-a');

    expect(await loadProjectAssets('course-1')).toHaveLength(0);
  });

  it('מחיקת פרויקט מוחקת גם את הבלובים שלו, כדי שלא יישארו יתומים', async () => {
    const project = projectFile('לומדה', '2026-01-01T10:00:00.000Z', [asset('asset-a')]);
    await saveProject(project);
    await putAsset(project.course.id, asset('asset-a'), testBlob('a'));
    await putAsset('course-other', asset('asset-b'), testBlob('b'));

    await deleteProject(project.course.id);

    expect(await loadProject(project.course.id)).toBeUndefined();
    expect(await loadProjectAssets(project.course.id)).toHaveLength(0);
    expect(await loadProjectAssets('course-other')).toHaveLength(1);
  });
});

describe('הפרויקט האחרון', () => {
  it('נשמר ונקרא, וניתן לניקוי', async () => {
    expect(await getLastProjectId()).toBeNull();

    await setLastProjectId('course-1');
    expect(await getLastProjectId()).toBe('course-1');

    await setLastProjectId(null);
    expect(await getLastProjectId()).toBeNull();
  });
});
