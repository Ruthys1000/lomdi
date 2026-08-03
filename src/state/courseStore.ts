import { create } from "zustand";
import { temporal } from "zundo";
import { throttle } from "@/lib/throttle";
import { createBlock, createChapter } from "@/model/factory";
import * as ops from "@/model/operations";
import type {
  BlockContent,
  BlockSettings,
  Chapter,
  Course,
  Theme,
} from "@/model/types";

/**
 * מסמך הלומדה.
 *
 * ה-store הזה מחזיק אך ורק את מה שנשמר לקובץ ומיוצא לתוצר. מצב העורך
 * (מה נבחר, איזה viewport, אילו פאנלים פתוחים) חי ב-editorStore, ולכן
 * שינוי בחירה אינו נחשב שינוי במסמך ואינו מייצר שמירה או רשומת undo.
 *
 * כל הפעולות מאצילות ל-src/model/operations, שהן פונקציות טהורות ובדוקות.
 * ה-store הוא עטיפה דקה בכוונה — כדי שההיגיון יישאר ניתן לבדיקה בלי React.
 *
 * ההיסטוריה (zundo) עוטפת את ה-store הזה בלבד. זו הסיבה שהחלוקה בין
 * courseStore ל-editorStore חשובה: בחירת בלוק, פתיחת פאנל או מעבר בין
 * מכשירים אינם שינוי במסמך, ולכן אינם מייצרים רשומת undo שהמשתמש יצטרך
 * ללחוץ עליה פעמיים כדי להגיע לשינוי אמיתי.
 */

/** מרווח קיבוץ להיסטוריה — הקלדה רצופה נרשמת כפעולה אחת */
const HISTORY_THROTTLE = 400;

/** מגבלת ההיסטוריה לפי סעיף 14 באפיון */
const HISTORY_LIMIT = 50;

interface CourseState {
  course: Course | null;

  loadCourse: (course: Course) => void;
  closeCourse: () => void;

  updateCourse: (patch: Partial<Omit<Course, "id" | "chapters">>) => void;
  setTheme: (theme: Theme) => void;

  addChapter: (atIndex?: number) => string | undefined;
  updateChapter: (
    chapterId: string,
    patch: Partial<Omit<Chapter, "id" | "blocks">>,
  ) => void;
  removeChapter: (chapterId: string) => void;
  duplicateChapter: (chapterId: string) => void;
  moveChapter: (from: number, to: number) => void;

  addBlock: (
    chapterId: string,
    type: string,
    atIndex?: number,
  ) => string | undefined;
  updateBlockContent: (blockId: string, content: BlockContent) => void;
  updateBlockSettings: (blockId: string, patch: Partial<BlockSettings>) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => string | undefined;
  moveBlockWithinChapter: (chapterId: string, from: number, to: number) => void;
  moveBlockToChapter: (
    blockId: string,
    targetChapterId: string,
    targetIndex: number,
  ) => void;
  nudgeBlock: (blockId: string, direction: -1 | 1) => void;
}

export const useCourseStore = create<CourseState>()(
  temporal(
    (set, get) => {
      /** עוזר שמונע כתיבה כשאין לומדה טעונה, ומצמצם חזרתיות */
      const mutate = (fn: (course: Course) => Course) => {
        const { course } = get();
        if (!course) return;
        const next = fn(course);
        if (next !== course) set({ course: next });
      };

      return {
        course: null,

        loadCourse: (course) => {
          set({ course });
          // ההיסטוריה מתאפסת מיד, אחרת undo היה מחזיר את המשתמש לפרויקט
          // שכבר סגר. סינכרוני ולא דחוי, כדי שלא ייפתח חלון זמן שבו
          // ההיסטוריה עדיין מכילה את הפרויקט הקודם.
          useCourseStore.temporal.getState().clear();
        },
        closeCourse: () => set({ course: null }),

        updateCourse: (patch) =>
          mutate((course) => ops.updateCourse(course, patch)),
        setTheme: (theme) => mutate((course) => ({ ...course, theme })),

        addChapter: (atIndex) => {
          const chapter = createChapter();
          mutate((course) => ops.addChapter(course, chapter, atIndex));
          return get().course ? chapter.id : undefined;
        },

        updateChapter: (chapterId, patch) =>
          mutate((course) => ops.updateChapter(course, chapterId, patch)),

        removeChapter: (chapterId) =>
          mutate((course) => ops.removeChapter(course, chapterId)),

        duplicateChapter: (chapterId) =>
          mutate((course) => ops.duplicateChapterById(course, chapterId)),

        moveChapter: (from, to) =>
          mutate((course) => ops.moveChapter(course, from, to)),

        addBlock: (chapterId, type, atIndex) => {
          const block = createBlock(type);
          mutate((course) => ops.addBlock(course, chapterId, block, atIndex));
          return ops.findBlock(get().course!, block.id) ? block.id : undefined;
        },

        updateBlockContent: (blockId, content) =>
          mutate((course) => ops.updateBlockContent(course, blockId, content)),

        updateBlockSettings: (blockId, patch) =>
          mutate((course) => ops.updateBlockSettings(course, blockId, patch)),

        removeBlock: (blockId) =>
          mutate((course) => ops.removeBlock(course, blockId)),

        duplicateBlock: (blockId) => {
          const { course } = get();
          if (!course) return undefined;
          const result = ops.duplicateBlockById(course, blockId);
          if (result.course !== course) set({ course: result.course });
          return result.newBlockId;
        },

        moveBlockWithinChapter: (chapterId, from, to) =>
          mutate((course) =>
            ops.moveBlockWithinChapter(course, chapterId, from, to),
          ),

        moveBlockToChapter: (blockId, targetChapterId, targetIndex) =>
          mutate((course) =>
            ops.moveBlockToChapter(
              course,
              blockId,
              targetChapterId,
              targetIndex,
            ),
          ),

        nudgeBlock: (blockId, direction) =>
          mutate((course) => ops.nudgeBlock(course, blockId, direction)),
      };
    },
    {
      limit: HISTORY_LIMIT,
      // רק המסמך נכנס להיסטוריה. שאר ה-store הוא פונקציות, ושמירתן
      // הייתה גם מנפחת את ההיסטוריה וגם משחזרת סגירות ישנות ב-undo.
      partialize: (state) => ({ course: state.course }),
      equality: (a, b) => a.course === b.course,
      handleSet: (handleSet) => throttle(handleSet, HISTORY_THROTTLE),
    },
  ),
);

/**
 * ה-API של ההיסטוריה. עטוף בפונקציות ולא נחשף ישירות, כדי ש-loadCourse
 * יוכל לנקות את ההיסטוריה — פרויקט חדש לא אמור לאפשר undo אל הפרויקט
 * הקודם.
 */
export const courseHistory = {
  undo: () => useCourseStore.temporal.getState().undo(),
  redo: () => useCourseStore.temporal.getState().redo(),
  clear: () => useCourseStore.temporal.getState().clear(),
  canUndo: () => useCourseStore.temporal.getState().pastStates.length > 0,
  canRedo: () => useCourseStore.temporal.getState().futureStates.length > 0,
};
