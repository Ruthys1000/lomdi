import { z } from 'zod';
import { richTextDocSchema, emptyRichText } from '@/model/richText';
import { aspectRatioSchema, assetRefSchema, buttonSchema, collectAssetIds, createButton, roundnessSchema } from '../shared';

/**
 * הפריסה נשמרת במונחי start/end ולא right/left, כך שאותו תוכן נראה נכון
 * גם בלומדה בעברית וגם בלומדה באנגלית. במובייל הפריסה עוברת אוטומטית
 * לאנכית (סעיף 7.4).
 */
export const textImageContentSchema = z.object({
  doc: richTextDocSchema,
  imageAssetId: assetRefSchema,
  alt: z.string(),
  caption: z.string(),
  layout: z.enum(['imageStart', 'imageEnd', 'imageTop']),
  ratio: z.enum(['50-50', '40-60', '60-40']),
  verticalAlign: z.enum(['start', 'center']),
  aspectRatio: aspectRatioSchema,
  roundness: roundnessSchema,
  button: buttonSchema,
});

export type TextImageContent = z.infer<typeof textImageContentSchema>;

export const createTextImageContent = (
  overrides: Partial<TextImageContent> = {},
): TextImageContent => ({
  doc: emptyRichText(),
  imageAssetId: '',
  alt: '',
  caption: '',
  layout: 'imageEnd',
  ratio: '50-50',
  verticalAlign: 'center',
  aspectRatio: '4:3',
  roundness: 'medium',
  button: createButton(),
  ...overrides,
});

export const textImageAssetIds = (content: TextImageContent): string[] =>
  collectAssetIds(content.imageAssetId);
