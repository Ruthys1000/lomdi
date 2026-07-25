import { create } from 'zustand';

/**
 * הודעות קצרות אחרי פעולה (סעיף 20).
 *
 * הן חלק ממצב העורך ולא מהמסמך, ולכן ב-store נפרד: טוסט לא אמור להיכנס
 * לקובץ הפרויקט, ליצור רשומת undo או להפעיל שמירה אוטומטית.
 */

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  /** פעולת ביטול אופציונלית, למשל אחרי מחיקה */
  action?: { label: string; run: () => void };
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, options?: { tone?: ToastTone; action?: Toast['action'] }) => void;
  dismiss: (id: number) => void;
}

const DURATION = 4000;
let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, options = {}) => {
    const id = nextId++;
    const toast: Toast = { id, message, tone: options.tone ?? 'info', action: options.action };

    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => get().dismiss(id), DURATION);
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** קיצור לשימוש מחוץ לרכיבי React */
export const toast = (message: string, options?: Parameters<ToastState['show']>[1]) =>
  useToastStore.getState().show(message, options);
