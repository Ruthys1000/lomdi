import { createContext, useContext } from 'react';
import type { Direction } from '@/model/types';

/**
 * ההקשר שה-Renderer מקבל מבחוץ.
 *
 * `resolveAssetUrl` הוא הצומת המרכזי של כל מנגנון הנכסים: בלוקים שומרים
 * assetId בלבד ולעולם לא כתובת. בעורך הפונקציה מחזירה object URL זמני
 * (`blob:…`), ובייצוא היא מחזירה נתיב יחסי (`assets/images/…`).
 * כך מובטח מבנית שלא ייכנס נתיב blob לתוצר המיוצא (סעיף 17 באפיון).
 */
export interface RenderContextValue {
  direction: Direction;
  resolveAssetUrl: (assetId: string) => string | undefined;
  /** true בתוך קנבס העריכה — מאפשר לרנדרר להשבית אנימציות פתיחה וכדומה */
  isEditing: boolean;
  /**
   * true בעורך ובתצוגה המקדימה (סביבות היוצר), false בתוצר המיוצא (הלומד).
   * מבדיל בין השניים — שגם `isEditing=false` — כדי להראית ליוצר רמזים כמו
   * placeholder לתמונה עם הפרומפט המומלץ, בלי שהלומד יראה אותם בתוצר.
   */
  authoring: boolean;
}

const fallback: RenderContextValue = {
  direction: 'rtl',
  resolveAssetUrl: () => undefined,
  isEditing: false,
  authoring: false,
};

/** ב-React 19 אפשר להשתמש בהקשר עצמו כ-Provider: <RenderContext value={…}> */
export const RenderContext = createContext<RenderContextValue>(fallback);

export function useRenderContext(): RenderContextValue {
  return useContext(RenderContext);
}
