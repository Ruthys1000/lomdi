/**
 * שמות הבלוקים בעברית.
 *
 * מודול נפרד ונטול תלויות בכוונה: הרנדרר צריך את השמות כדי להציג מצב
 * ביניים בקנבס, אבל ייבוא של registry.shared היה גורר את zod ואת כל
 * סכמות הבלוקים לתוך חבילת הלומדה המיוצאת. registry.shared מייבא מכאן,
 * ולכן אין כפילות בין השניים.
 */
export const blockLabels: Record<string, string> = {
  hero: 'כותרת ראשית',
  richText: 'טקסט',
  image: 'תמונה',
  textImage: 'טקסט ותמונה',
  cards: 'כרטיסים',
  accordion: 'אקורדיון',
  video: 'וידאו',
  quiz: 'שאלת בחירה',
  divider: 'מפריד',
  quote: 'ציטוט',
};

export function blockLabel(type: string): string {
  return blockLabels[type] ?? type;
}
