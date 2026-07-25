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

  selectChapter: (chapterId: string | null) => void;
  selectBlock: (blockId: string | null, chapterId?: string) => void;
  clearSelection: () => void;
  toggleChapterCollapsed: (chapterId: string) => void;
  setChapterCollapsed: (chapterId: string, collapsed: boolean) => void;
  setViewport: (viewport: Viewport) => void;
  setPreviewOpen: (open: boolean) => void;
  reset: () => void;
}

const initial = {
  selectedChapterId: null,
  selectedBlockId: null,
  collapsedChapterIds: [] as string[],
  viewport: 'desktop' as Viewport,
  isPreviewOpen: false,
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
  reset: () => set(initial),
}));
