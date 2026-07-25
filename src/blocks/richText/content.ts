import { z } from 'zod';
import { richTextDocSchema, emptyRichText, richText, paragraph } from '@/model/richText';
import type { RichTextDoc } from '@/model/types';

export const richTextContentSchema = z.object({
  doc: richTextDocSchema,
  maxWidth: z.enum(['narrow', 'normal', 'wide']),
});

export type RichTextContent = z.infer<typeof richTextContentSchema>;

export const createRichTextContent = (
  overrides: Partial<RichTextContent> = {},
): RichTextContent => ({
  doc: emptyRichText(),
  maxWidth: 'normal',
  ...overrides,
});

export const richTextFrom = (...paragraphs: string[]): RichTextDoc =>
  richText(...paragraphs.map(paragraph));

export const richTextAssetIds = (): string[] => [];
