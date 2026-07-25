import { z } from 'zod';
import type { RichTextDoc, RichTextNode } from './types';

/**
 * הרשימה הלבנה של הטקסט העשיר.
 *
 * זהו גבול האבטחה של התוכן: רק nodes ו-marks שמופיעים כאן ייכנסו למסמך
 * ורק הם יעברו רינדור. כל השאר מושמט. הרשימה תואמת בכוונה למה שסרגל
 * העריכה מציע (סעיף 7.2), כדי שלא יהיה פער בין מה שאפשר לכתוב לבין מה
 * שאפשר להציג.
 */
export const ALLOWED_NODES = [
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'hardBreak',
] as const;

export const ALLOWED_MARKS = ['bold', 'italic', 'underline', 'strike', 'link', 'textStyle'] as const;

export type AllowedNode = (typeof ALLOWED_NODES)[number];
export type AllowedMark = (typeof ALLOWED_MARKS)[number];

const markSchema = z.object({
  type: z.enum(ALLOWED_MARKS),
  attrs: z.record(z.unknown()).optional(),
});

export const richTextNodeSchema: z.ZodType<RichTextNode> = z.lazy(() =>
  z.object({
    type: z.enum(ALLOWED_NODES),
    attrs: z.record(z.unknown()).optional(),
    content: z.array(richTextNodeSchema).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().optional(),
  }),
);

export const richTextDocSchema = z.object({
  type: z.literal('doc'),
  content: z.array(richTextNodeSchema).optional(),
}) as z.ZodType<RichTextDoc>;

// ─────────────────────────── בונים ───────────────────────────

export function paragraph(text: string): RichTextNode {
  return text
    ? { type: 'paragraph', content: [{ type: 'text', text }] }
    : { type: 'paragraph' };
}

export function heading(level: 2 | 3 | 4, text: string): RichTextNode {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}

export function bulletList(items: string[]): RichTextNode {
  return {
    type: 'bulletList',
    content: items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
  };
}

export function richText(...nodes: RichTextNode[]): RichTextDoc {
  return { type: 'doc', content: nodes };
}

export const emptyRichText = (): RichTextDoc => richText(paragraph(''));

/** טקסט נקי מתוך מסמך — לתצוגות מקוצרות בסרגל המבנה ולחיפוש */
export function richTextToPlainText(doc: RichTextNode | undefined): string {
  if (!doc) return '';
  if (doc.type === 'text') return doc.text ?? '';
  const inner = (doc.content ?? []).map(richTextToPlainText).join(' ');
  return inner.replace(/\s+/g, ' ').trim();
}

/** true כשהמסמך ריק לגמרי — לצורך מצבי ריק ואימות תוכן */
export function isRichTextEmpty(doc: RichTextNode | undefined): boolean {
  if (!doc?.content?.length) return true;
  return doc.content.every(
    (node) => !node.content?.length && !node.text?.trim() && node.type !== 'hardBreak',
  );
}
