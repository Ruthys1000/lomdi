import { useCallback } from 'react';
import { useAssetStore } from '@/state/assetStore';

/**
 * ה-`resolveAssetUrl` של העורך.
 *
 * מחזיר `blob:` מתוך `assetStore`, בעוד שבתוצר המיוצא אותה פונקציה מחזירה
 * נתיב יחסי (`runtime/main.tsx`). זו הנקודה היחידה שבה מזהה נכס הופך
 * לכתובת, ולכן נתיב `blob:` לא יכול לדלוף לקובץ הפרויקט או לתוצר.
 *
 * תלוי ב-`urls` ולא ב-`assets`: הכתובות משתנות בטעינת פרויקט, ורכיבים
 * שמציגים מדיה חייבים לרונדר מחדש בדיוק אז.
 */
export function useAssetUrlResolver(): (assetId: string) => string | undefined {
  const urls = useAssetStore((state) => state.urls);
  return useCallback((assetId: string) => urls[assetId], [urls]);
}
