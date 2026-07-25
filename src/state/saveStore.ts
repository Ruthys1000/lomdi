import { create } from 'zustand';

/**
 * מצב השמירה האוטומטית.
 *
 * מצב עורך ולא מסמך, ולכן ב-store נפרד: אחרת כל מעבר ל"שומר…" היה נחשב
 * שינוי במסמך, מייצר רשומת undo ומפעיל שמירה נוספת — לולאה.
 */

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface SaveState {
  status: SaveStatus;
  lastSavedAt: number | null;
  error: string | null;

  markDirty: () => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: (message: string) => void;
  reset: () => void;
}

export const useSaveStore = create<SaveState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  error: null,

  markDirty: () => set((state) => (state.status === 'saving' ? state : { status: 'dirty' })),
  markSaving: () => set({ status: 'saving', error: null }),
  markSaved: () => set({ status: 'saved', lastSavedAt: Date.now(), error: null }),
  markError: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', lastSavedAt: null, error: null }),
}));
