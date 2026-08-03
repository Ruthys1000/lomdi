/**
 * התראה בתוך העמוד — לכשל שהמשתמש חייב לראות במקום שבו הוא קרה.
 *
 * לא טוסט: טוסט נעלם אחרי כמה שניות ומוצג בתחתית המסך, ולכן אינו מתאים
 * לכשל שנשאר נכון עד שמשהו משתנה (אחסון חסום, פרויקט שלא נמצא). בנוסף,
 * טוסט שנפתח מאחורי `<dialog>` מודאלי אינו נראה כלל.
 *
 * `role="alert"` ולא `status`: אלה כשלים שעוצרים את מה שהמשתמש ניסה לעשות.
 */
export function Alert({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <ul
      role="alert"
      className="space-y-1 rounded-xl bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn"
    >
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
