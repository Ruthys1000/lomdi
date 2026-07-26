import { create } from 'zustand';

/**
 * מצב העורך — כל מה שלא נשמר לקובץ ולא מיוצא לתוצר.
 *
 * ההפרדה מ-courseStore היא דרישה מפורשת באפיון (סעיף 25), והיא גם מה
 * שמאפשר להתייחס לכל שינוי ב-courseStore כשינוי אמיתי במסמך: שמירה
 * אוטומטית ו-undo יוכלו להאזין לו ישירות בלי לסנן רעש של בחירות ופאנלים.
 */

export type Viewport = 'desktop' | 'tablet' | 'mobile';

/** רוחב אזור התצוגה לכל מכשיר, בפיקסלים */
export const viewportWidths: Record<Viewport, number | null> = {
  desktop: null,
  tablet: 834,
  mobile: 390,
};

interface EditorState {
  selectedChapterId: string | null;
  selectedBlockId: string | null;
  collapsedChapterIds: string[];
  viewport: Viewport;
  isPreviewOpen: boolean;
  /**
   * האם הפאנלים הצדדיים פתוחים.
   *
   * רלוונטי רק מתחת ל-lg, שם הפריסה עוברת לעמודה אחת והם הופכים למגירות.
   * מעל lg הם תמיד בגריד והדגלים אינם משפיעים — ולכן ברירת המחדל היא
   * סגור: מסך צר אמור להיפתח על הקנבס, לא על שני פאנלים שמכסים אותו.
   */
  isOutlineOpen: boolean;
  isInspectorOpen: boolean;
  /**
   * בלוק שממתין לאישור מחיקה.
   *
   * חי כאן ולא ב-state מקומי של הקנבס, כי גם סרגל הפעולות של הבלוק וגם
   * מקש Delete מבקשים את אותה מחיקה — ושניהם צריכים להגיע לאותו חלון
   * אישור אחד.
   */
  blockPendingDelete: string | null;

  selectChapter: (chapterId: string | null) => void;
  selectBlock: (blockId: string | null, chapterId?: string) => void;
  clearSelection: () => void;
  toggleChapterCollapsed: (chapterId: string) => void;
  setChapterCollapsed: (chapterId: string, collapsed: boolean) => void;
  setViewport: (viewport: Viewport) => void;
  setPreviewOpen: (open: boolean) => void;
  setOutlineOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  requestBlockDelete: (blockId: string) => void;
  cancelBlockDelete: () => void;
  reset: () => void;
}

const initial = {
  selectedChapterId: null,
  selectedBlockId: null,
  collapsedChapterIds: [] as string[],
  viewport: 'desktop' as Viewport,
  isPreviewOpen: false,
  isOutlineOpen: false,
  isInspectorOpen: false,
  blockPendingDelete: null as string | null,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initial,

  // בחירת פרק מנקה בחירת בלוק: הפאנל השמאלי מציג או הגדרות בלוק או
  // הגדרות הלומדה, ושתי בחירות פעילות בו-זמנית היו הופכות אותו לדו-משמעי.
  selectChapter: (chapterId) => set({ selectedChapterId: chapterId, selectedBlockId: null }),

  selectBlock: (blockId, chapterId) =>
    set((state) => ({
      selectedBlockId: blockId,
      selectedChapterId: chapterId ?? state.selectedChapterId,
    })),

  clearSelection: () => set({ selectedBlockId: null }),

  toggleChapterCollapsed: (chapterId) =>
    set((state) => ({
      collapsedChapterIds: state.collapsedChapterIds.includes(chapterId)
        ? state.collapsedChapterIds.filter((id) => id !== chapterId)
        : [...state.collapsedChapterIds, chapterId],
    })),

  setChapterCollapsed: (chapterId, collapsed) =>
    set((state) => ({
      collapsedChapterIds: collapsed
        ? [...new Set([...state.collapsedChapterIds, chapterId])]
        : state.collapsedChapterIds.filter((id) => id !== chapterId),
    })),

  setViewport: (viewport) => set({ viewport }),
  setPreviewOpen: (isPreviewOpen) => set({ isPreviewOpen }),

  // פתיחת מגירה אחת סוגרת את השנייה: מתחת ל-lg שתיהן מכסות את הקנבס,
  // ושתיים פתוחות בו-זמנית משאירות את המשתמש בלי שום תצוגה של הלומדה
  setOutlineOpen: (isOutlineOpen) => set({ isOutlineOpen, isInspectorOpen: false }),
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen, isOutlineOpen: false }),

  requestBlockDelete: (blockId) => set({ blockPendingDelete: blockId }),
  cancelBlockDelete: () => set({ blockPendingDelete: null }),
  reset: () => set(initial),
}));
