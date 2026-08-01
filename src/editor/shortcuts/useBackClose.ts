import { useEffect, useRef } from 'react';

/**
 * מחבר שכבה נפתחת (overlay/מודאל/מסך) לכפתור "חזרה" של הדפדפן.
 *
 * ללא זה, באפליקציית SPA שמנוהלת כולה ב-state, "חזרה" בנייד יוצא מכל האתר
 * במקום לסגור את השכבה הפתוחה. הפתרון: כשהשכבה נפתחת (`active`) דוחפים רשומת
 * היסטוריה אחת; לחיצת "חזרה" (`popstate`) קוראת ל-`onClose` במקום לעזוב את
 * הדף. כשהשכבה נסגרת מבפנים (כפתור/Esc) מנקים את הרשומה שדחפנו ב-`history.back()`.
 *
 * כל שכבה מנהלת רשומה משלה, ולכן שכבות מוערמות נסגרות LIFO — בדיוק מה שהמשתמש
 * מצפה מ"חזרה". `onClose` נשמר ב-ref כדי שהאפקט לא יידחוף רשומה חדשה בכל רינדור.
 */
export function useBackClose(active: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    window.history.pushState({ lcOverlay: true }, '');

    let closedByBack = false;
    const onPop = () => {
      closedByBack = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // נסגר מבפנים (לא ב"חזרה") → מסירים את הרשומה שדחפנו כדי לא להשאיר
      // "חזרה מתה" שרק מבטלת לחיצה אחת.
      if (!closedByBack) window.history.back();
    };
  }, [active]);
}
