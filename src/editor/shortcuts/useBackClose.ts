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
 *
 * **בטיחות הערמה (שתי הגנות):**
 *
 * 1. תיוג רשומה ב-id: `onClose` נקרא רק כשהרשומה *שלנו* כבר אינה הנוכחית.
 * 2. מחסנית גלובלית: רק השכבה *העליונה* מגיבה ל-`popstate`. בלי זה, חזרה
 *    מבורר קבצים בנייד (שדוחף רשומת היסטוריה זמנית ואז נוחת חזרה על רשומת
 *    המודאל) הייתה מפעילה את מאזין העורך — `current !== appId` — ומחזירה
 *    את המשתמש לדף הבית באמצע בחירת תמונה.
 */
let overlayCounter = 0;
const overlayStack: number[] = [];

interface OverlayState {
  lcOverlayId?: number;
}

/** לטסטים בלבד — מאפס את מונה השכבות בין מקרי בדיקה */
export function resetBackCloseStackForTests(): void {
  overlayCounter = 0;
  overlayStack.length = 0;
}

export function useBackClose(active: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const id = ++overlayCounter;
    window.history.pushState({ lcOverlayId: id } satisfies OverlayState, '');
    overlayStack.push(id);

    let closedByBack = false;

    const removeFromStack = () => {
      const index = overlayStack.lastIndexOf(id);
      if (index !== -1) overlayStack.splice(index, 1);
    };

    const onPop = (event: PopStateEvent) => {
      // רק השכבה העליונה מגיבה. אחרת חזרה מבורר-קבצים (או מכל רשומה זמנית
      // מעל המודאל) הייתה סוגרת גם את שכבת העורך שמתחת.
      if (overlayStack[overlayStack.length - 1] !== id) return;

      // אם הרשומה שלנו שוב הנוכחית — שכבה זמנית מעלינו נסגרה, לא אנחנו.
      const current = (event.state as OverlayState | null)?.lcOverlayId;
      if (current === id) return;

      closedByBack = true;
      removeFromStack();
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      // חייבים להסיר מהמחסנית *לפני* history.back(): ה-popstate סינכרוני,
      // ואם נישאר בראש המחסנית נסגור את עצמנו בטעות על ניקוי פנימי.
      removeFromStack();
      // נסגר מבפנים (לא ב"חזרה") → מסירים את הרשומה שדחפנו כדי לא להשאיר
      // "חזרה מתה" שרק מבטלת לחיצה אחת.
      if (!closedByBack) window.history.back();
    };
  }, [active]);
}
