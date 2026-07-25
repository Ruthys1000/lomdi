import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { useSaveStore } from '@/state/saveStore';
import { cancelPendingSave, saveNow, startAutosave } from './autosave';
import { listProjects, loadProject, resetDbConnection } from './db';

const asset: AssetMeta = {
  id: 'asset-a',
  originalName: 'a.png',
  safeName: 'asset-a.png',
  kind: 'image',
  mimeType: 'image/png',
  size: 4,
  exportPath: 'assets/images/asset-a.png',
};

let stop: (() => void) | undefined;

beforeEach(() => {
  resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
  cancelPendingSave();

  useCourseStore.setState({ course: null });
  useAssetStore.setState({ assets: [], urls: {} });
  useSaveStore.getState().reset();
  useEditorStore.getState().reset();
});

afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
});

/** ממתין לסבב ה-microtasks שבו כתיבת ה-IndexedDB מסתיימת */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('שמירה אוטומטית', () => {
  it('שומרת אחרי השהיה, ולא בכל הקלדה', async () => {
    vi.useFakeTimers();
    stop = startAutosave();

    useCourseStore.getState().loadCourse(createCourse({ title: 'טיוטה' }));
    useCourseStore.getState().updateCourse({ title: 'טיוטה מעודכנת' });

    expect(useSaveStore.getState().status).toBe('dirty');

    await vi.advanceTimersByTimeAsync(1500);
    vi.useRealTimers();
    await settle();

    // שתי הפעולות התכנסו לכתיבה אחת
    expect(await listProjects()).toHaveLength(1);
    expect(useSaveStore.getState().status).toBe('saved');
  });

  it('אינה נכתבת בגלל שינוי במצב העורך', async () => {
    vi.useFakeTimers();
    const course = createCourse();
    useCourseStore.setState({ course });

    stop = startAutosave();

    useEditorStore.getState().selectChapter(course.chapters[0].id);
    useEditorStore.getState().setViewport('mobile');
    useEditorStore.getState().setPreviewOpen(true);

    await vi.advanceTimersByTimeAsync(3000);
    vi.useRealTimers();
    await settle();

    expect(useSaveStore.getState().status).toBe('idle');
    expect(await listProjects()).toHaveLength(0);
  });

  it('נכתבת גם בעקבות שינוי ברשימת הנכסים', async () => {
    vi.useFakeTimers();
    useCourseStore.setState({ course: createCourse() });
    stop = startAutosave();

    useAssetStore.setState({ assets: [asset], urls: {} });

    await vi.advanceTimersByTimeAsync(1500);
    vi.useRealTimers();
    await settle();

    const [summary] = await listProjects();
    expect((await loadProject(summary.id))?.assets).toEqual([asset]);
  });

  it('saveNow כותבת מיד ומעדכנת את זמן השמירה', async () => {
    useCourseStore.setState({ course: createCourse({ title: 'שמירה ידנית' }) });

    expect(await saveNow()).toBe(true);

    expect(useSaveStore.getState().status).toBe('saved');
    expect(useSaveStore.getState().lastSavedAt).not.toBeNull();
    expect((await listProjects())[0].title).toBe('שמירה ידנית');
  });

  it('saveNow אינה עושה דבר כשאין לומדה טעונה', async () => {
    expect(await saveNow()).toBe(false);
    expect(await listProjects()).toHaveLength(0);
  });

  it('מדווחת שגיאה בעברית כשהאחסון נכשל, ואינה זורקת', async () => {
    useCourseStore.setState({ course: createCourse() });
    // דפדפן בגלישה פרטית: פתיחת בסיס הנתונים נכשלת
    resetDbConnection();
    globalThis.indexedDB = {
      open: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    } as unknown as IDBFactory;

    expect(await saveNow()).toBe(false);
    expect(useSaveStore.getState().status).toBe('error');
    expect(useSaveStore.getState().error).toContain('אחסון');
  });

  it('הניתוק מפסיק את ההאזנה', async () => {
    vi.useFakeTimers();
    const unsubscribe = startAutosave();
    unsubscribe();

    useCourseStore.getState().loadCourse(createCourse());

    await vi.advanceTimersByTimeAsync(3000);
    vi.useRealTimers();
    await settle();

    expect(await listProjects()).toHaveLength(0);
  });
});
