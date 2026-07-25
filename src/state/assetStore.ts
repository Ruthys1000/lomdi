import { create } from 'zustand';
import type { AssetMeta } from '@/model/types';

/**
 * נכסי הפרויקט.
 *
 * הם חלק מהפרויקט אבל **לא חלק מ-`Course`**, ולכן הם ב-store נפרד ואינם
 * נכנסים להיסטוריית ה-Undo. שתי סיבות: Blob אינו ניתן לביטול בצורה
 * משמעותית (ה-undo היה מחזיר רשומה שמצביעה לקובץ שכבר נמחק), ובלוק
 * ששוכפל חייב להצביע לאותו נכס עצמו ולא לעותק שלו. אותה הפרדה כבר קיימת
 * במודל: `ProjectFile` מפריד `course` מ-`assets`.
 *
 * ה-object URL נוצר עם טעינת הנכס ונשמר ב-state, ולא נוצר עצלנית בזמן
 * הרינדור. אחרת רכיב שמבקש כתובת לנכס שזה עתה נוסף היה מקבל `undefined`
 * ולא היה מרונדר שוב כשהכתובת מוכנה.
 */

interface AssetState {
  assets: AssetMeta[];
  /** assetId → blob: URL. זה מה ש-resolveAssetUrl מחזיר בעורך */
  urls: Record<string, string>;

  loadAssets: (entries: { meta: AssetMeta; blob: Blob }[]) => void;
  addAsset: (meta: AssetMeta, blob: Blob) => void;
  removeAsset: (assetId: string) => void;
  clear: () => void;
}

/**
 * שחרור כתובת שאינה בשימוש.
 *
 * בלי זה כל טעינת פרויקט הייתה משאירה את הבלובים של הפרויקט הקודם תקועים
 * בזיכרון עד לרענון הדף — דליפה שגדלה עם כל מעבר בין פרויקטים.
 */
const revoke = (url: string | undefined) => {
  if (url) URL.revokeObjectURL(url);
};

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  urls: {},

  loadAssets: (entries) => {
    Object.values(get().urls).forEach(revoke);

    const urls: Record<string, string> = {};
    for (const { meta, blob } of entries) {
      urls[meta.id] = URL.createObjectURL(blob);
    }

    set({ assets: entries.map((entry) => entry.meta), urls });
  },

  addAsset: (meta, blob) =>
    set((state) => {
      revoke(state.urls[meta.id]);
      return {
        assets: [...state.assets.filter((asset) => asset.id !== meta.id), meta],
        urls: { ...state.urls, [meta.id]: URL.createObjectURL(blob) },
      };
    }),

  removeAsset: (assetId) =>
    set((state) => {
      revoke(state.urls[assetId]);
      const urls = { ...state.urls };
      delete urls[assetId];
      return { assets: state.assets.filter((asset) => asset.id !== assetId), urls };
    }),

  clear: () => {
    Object.values(get().urls).forEach(revoke);
    set({ assets: [], urls: {} });
  },
}));
