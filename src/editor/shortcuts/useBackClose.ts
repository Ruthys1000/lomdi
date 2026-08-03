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
 * **בטיחות הערמה:** אירוע `popstate` מגיע ל*כל* המאזינים בכל ניווט, ולא רק
 * למאזין של הרשומה שנבלעה. בלי הגנה, סגירת שכבה פנימית (ה-`history.back()` שלה)
 * הייתה מפעילה בטעות גם את `onClose` של השכבה החיצונית — למשל הוספת בלוק דרך
 * הספרייה שהחזירה את המשתמש ממסך העריכה למסך הפתיחה. לכן כל רשומה מתויגת ב-id
 * ייחודי, ו-`onClose` נקרא רק כשהרשומה *שלנו* כבר אינה הנוכחית (כלומר אנחנו
 * נבלענו ב-back), ולא כששכבה שמעלינו נסגרה וחזרנו להיות הנוכחיים.
 */
let overlayCounter = 0;

interface OverlayState {
  lcOverlayId?: number;
}

export function useBackClose(active: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const id = ++overlayCounter;
    window.history.pushState({ lcOverlayId: id } satisfies OverlayState, '');

    let closedByBack = false;
    const onPop = (event: PopStateEvent) => {
      // אם הרשומה שלנו שוב הנוכחית — שכבה פנימית מעלינו נסגרה, לא אנחנו.
      // מתעלמים, כדי שלא נסגור את עצמנו על סגירת שכבה אחרת.
      const current = (event.state as OverlayState | null)?.lcOverlayId;
      if (current === id) return;

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
