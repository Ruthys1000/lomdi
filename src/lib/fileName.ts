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

/**
 * טביעה קצרה ויציבה של הכותרת המלאה, ב-ASCII.
 *
 * כותרת עברית-בלבד מתרוקנת ב-`asciiSlug`, ואז שתי לומדות שונות שיוצאו
 * באותו יום מקבלות את אותו שם בדיוק ודורסות זו את זו בתיקיית ההורדות.
 * ה-hash הזה (variant של djb2) מבדיל ביניהן, ונשאר קבוע לאותה כותרת כדי
 * שהורדה חוזרת לא תיצור שם חדש בכל פעם.
 */
export function titleHash(title: string): string {
  let hash = 5381;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) + hash + title.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).slice(0, 4).padStart(4, '0');
}

/** `lomdi-Safety-101-2026-07-25.zip` — הסיומת נמסרת שלמה, כולל הנקודה */
export function datedFileName(title: string, extension: string, date = new Date()): string {
  const slug = asciiSlug(title);
  const day = date.toISOString().slice(0, 10);
  const trimmed = title.trim();
  // שלושה מצבים: slug תקין מבדיל בעצמו; כותרת עברית-בלבד (slug ריק אך יש
  // תוכן) מקבלת hash כמבדיל, כדי ששתי לומדות לא ידרסו זו את זו; כותרת ריקה
  // לגמרי נשארת תאריך-בלבד כברירת המחדל של "לומדה ללא שם".
  const middle = slug ? `${slug}-` : trimmed ? `${titleHash(trimmed)}-` : '';

  return `${PREFIX}-${middle}${day}${extension}`;
}
