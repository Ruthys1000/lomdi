import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';

/**
 * הרחבות TipTap — מותאמות בדיוק לרשימה הלבנה של הרנדרר.
 *
 * מה שכבוי כאן כבוי בכוונה: אם המשתמש יוכל לכתוב בלוק קוד או קו אופקי,
 * הרנדרר פשוט לא יציג אותם והתוכן ייעלם בייצוא בלי אזהרה. הכלל הוא
 * שמה שאפשר לכתוב חייב להיות מה שאפשר להציג (ראה renderer/RichTextView).
 */
export function richTextExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      // אין להם ייצוג ברנדרר — עדיף לא לאפשר לכתוב אותם מלכתחילה
      codeBlock: false,
      code: false,
      horizontalRule: false,
    }),
    Underline,
    TextStyle,
    Link.configure({
      openOnClick: false,
      autolink: true,
      // חוסם javascript: ו-data: כבר בשלב הכתיבה, לא רק בהצגה
      protocols: ['http', 'https', 'mailto', 'tel'],
      HTMLAttributes: { rel: 'noopener noreferrer' },
    }),
    Placeholder.configure({ placeholder }),
  ];
}
