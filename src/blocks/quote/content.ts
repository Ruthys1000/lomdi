import { z } from 'zod';

/**
 * וריאציית עיצוב של הציטוט. `.default` שומר על תאימות אחורה — קובץ ישן
 * בלי השדה נטען כברירת המחדל.
 */
export const quoteVariantSchema = z.enum(['plain', 'emphasis', 'band']).default('emphasis');
export type QuoteVariant = z.infer<typeof quoteVariantSchema>;

export const quoteContentSchema = z.object({
  variant: quoteVariantSchema,
  text: z.string(),
  author: z.string(),
  role: z.string(),
});

export type QuoteContent = z.infer<typeof quoteContentSchema>;

export const createQuoteContent = (overrides: Partial<QuoteContent> = {}): QuoteContent => ({
  variant: 'emphasis',
  text: 'משפט אחד שנשאר בראש — ציטוט, עדות או עיקרון שמסכם את הרעיון.',
  author: 'שם הדובר',
  role: 'תפקיד או הקשר',
  ...overrides,
});

export const quoteAssetIds = (): string[] => [];
