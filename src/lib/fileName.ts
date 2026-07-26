/**
 * שמות של קבצים שהמשתמש מוריד — ASCII בלבד.
 *
 * זה נראה כמו ויתור מיותר בממשק עברי, והוא לא: Chromium משמיט שם קובץ
 * שאינו ASCII במלואו ומוריד במקומו קובץ בשם `download` — **בלי סיומת**.
 * קובץ כזה גם אינו מוצע במסנן `.zip` של חלון פתיחת הקובץ, כלומר המשתמש
 * מקבל קובץ שהוא לא יכול לפתוח בחזרה. נבדק בדפדפן אמיתי.
 *
 * הכותרת בעברית לא הולכת לאיבוד — היא נשמרת בתוך הקובץ ומוצגת שוב ברגע
 * שהוא נפתח. התאריך בשם מבדיל בין הורדות חוזרות.
 *
 * המודול משותף לקובץ הפרויקט (`.course.zip`) ולתוצר המיוצא (`.zip`), כדי
 * שלא יהיו שתי נוסחאות שם שיכולות להתפצל.
 */

const PREFIX = 'lomdi';

export function asciiSlug(title: string): string {
  return (
    title
      // כל מה שאינו ASCII נדיר יורד; אותיות לטיניות ומספרים שהמשתמש כתב נשמרים
      .replace(/[^ -~]/g, ' ')
      // התווים ש-Windows, macOS ו-Linux אוסרים בשם קובץ
      .replace(/[/\\:*?"<>|.]/g, ' ')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60)
      .replace(/^-+|-+$/g, '')
  );
}

/** `lomdi-Safety-101-2026-07-25.zip` — הסיומת נמסרת שלמה, כולל הנקודה */
export function datedFileName(title: string, extension: string, date = new Date()): string {
  const slug = asciiSlug(title);
  const day = date.toISOString().slice(0, 10);

  return `${PREFIX}-${slug ? `${slug}-` : ''}${day}${extension}`;
}
