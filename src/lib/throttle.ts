/**
 * מגביל קריאות לפונקציה לאחת בכל חלון זמן, לפי הקצה המוביל.
 *
 * הקריאה הראשונה עוברת מיד, וכל מה שנצבר בתוך החלון נבלע. זו בדיוק
 * ההתנהגות שנדרשת להיסטוריית ה-undo: הקלדה רצופה מייצרת רשומה אחת ולא
 * רשומה לכל תו, אבל התו הראשון כן נרשם ולכן שום שינוי לא הולך לאיבוד.
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let lastCall = 0;

  return (...args: A) => {
    const now = Date.now();
    if (now - lastCall < wait) return;
    lastCall = now;
    fn(...args);
  };
}
