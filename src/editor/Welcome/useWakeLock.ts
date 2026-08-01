import { useEffect } from 'react';

/**
 * מחזיק wake lock של המסך כל עוד `active` אמת.
 *
 * יצירת לומדה נמשכת עד דקה, ובנייד נעילת מסך אוטומטית מרקעת את הלשונית
 * ומנתקת את ה-stream ("Failed to fetch"). בקשת wake lock משאירה את המסך דולק
 * לאורך היצירה. ה-API לא נתמך בכל דפדפן ועלול להיכשל (למשל בלשונית לא-פעילה),
 * ולכן כל כשל נבלע בשקט — זו שכבת נוחות, לא תלות.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // דפדפן שלא תומך, או בקשה שנדחתה — ממשיכים בלי wake lock
      }
    };

    // אם המערכת שחררה את הנעילה (מעבר לרקע וחזרה) — מבקשים אותה מחדש כל עוד פעיל
    const onVisible = () => {
      if (!released && document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
