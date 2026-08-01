import {
  ALLOWED_MARKS,
  ALLOWED_NODES,
  emptyRichText,
  isRichTextEmpty,
  paragraph,
  richText,
  richTextDocSchema,
} from '@/model/richText';
import type { RichTextDoc, RichTextMark, RichTextNode } from '@/model/types';

/**
 * ניקוי טקסט עשיר שהגיע מ-AI לכדי מסמך ProseMirror תקין.
 *
 * שלא כמו `richTextDocSchema` שדוחה מסמך שלם ברגע שיש בו node אחד לא מוכר,
 * הפונקציה כאן *משמיטה* את מה שאסור ומשאירה את השאר — כי פלט של מודל שפה
 * לעולם לא מדויק, ומסמך שנדחה כולו הופך פסקה תקינה אחת לבלוק ריק. גבול
 * האבטחה נשמר: המקור לרשימה הלבנה הוא אותו `ALLOWED_NODES`/`ALLOWED_MARKS`
 * של הרנדרר (`src/model/richText.ts`), ולכן אין נתיב חדש שמכניס תוכן שהרנדרר
 * לא יודע להציג.
 */

const allowedNodes = new Set<string>(ALLOWED_NODES);
const allowedMarks = new Set<string>(ALLOWED_MARKS);

export interface SanitizeRichTextResult {
  doc: RichTextDoc;
  /** true אם משהו הושמט או תוקן — כדי להציג אזהרה למשתמש */
  changed: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeMarks(raw: unknown, report: { changed: boolean }): RichTextMark[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const marks: RichTextMark[] = [];
  for (const mark of raw) {
    if (isRecord(mark) && typeof mark.type === 'string' && allowedMarks.has(mark.type)) {
      marks.push(isRecord(mark.attrs) ? { type: mark.type, attrs: mark.attrs } : { type: mark.type });
    } else {
      report.changed = true;
    }
  }
  return marks.length ? marks : undefined;
}

/** רמת כותרת חוקית היא 2–4: h1 שמור לכותרת הלומדה והפרק, לא לגוף התוכן */
function headingAttrs(raw: unknown, report: { changed: boolean }): { level: 2 | 3 | 4 } {
  const level = isRecord(raw) ? raw.level : undefined;
  if (level === 3) return { level: 3 };
  if (level === 4) return { level: 4 };
  if (level !== 2) report.changed = true;
  return { level: 2 };
}

function sanitizeNode(raw: unknown, report: { changed: boolean }): RichTextNode | null {
  if (!isRecord(raw) || typeof raw.type !== 'string' || !allowedNodes.has(raw.type)) {
    report.changed = true;
    return null;
  }

  const node: RichTextNode = { type: raw.type };

  if (raw.type === 'heading') node.attrs = headingAttrs(raw.attrs, report);

  if (raw.type === 'text') {
    if (typeof raw.text !== 'string' || raw.text.length === 0) {
      report.changed = true;
      return null;
    }
    node.text = raw.text;
    const marks = sanitizeMarks(raw.marks, report);
    if (marks) node.marks = marks;
    return node;
  }

  if (Array.isArray(raw.content)) {
    const content: RichTextNode[] = [];
    for (const child of raw.content) {
      const clean = sanitizeNode(child, report);
      if (clean) content.push(clean);
    }
    if (content.length) node.content = content;
  }

  return node;
}

export function sanitizeRichText(raw: unknown): SanitizeRichTextResult {
  const report = { changed: false };

  // מודל שכתב טקסט חלק במקום מסמך — נעטוף אותו כפסקה במקום לאבד אותו
  if (typeof raw === 'string') {
    return { doc: raw.trim() ? richText(paragraph(raw)) : emptyRichText(), changed: true };
  }

  const rawContent = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.content)
      ? raw.content
      : null;

  if (!rawContent) return { doc: emptyRichText(), changed: true };

  const content: RichTextNode[] = [];
  for (const child of rawContent) {
    const clean = sanitizeNode(child, report);
    if (clean) content.push(clean);
  }

  const doc: RichTextDoc = { type: 'doc', content };

  // רשת ביטחון: אם למרות הניקוי המסמך לא עובר את הסכמה, נחזור למסמך ריק תקין
  const parsed = richTextDocSchema.safeParse(doc);
  if (!parsed.success) return { doc: emptyRichText(), changed: true };

  if (isRichTextEmpty(doc)) return { doc: emptyRichText(), changed: report.changed };

  return { doc, changed: report.changed };
}
