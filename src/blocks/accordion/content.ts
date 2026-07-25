import { z } from 'zod';
import { createId } from '@/model/ids';
import { richTextDocSchema, emptyRichText } from '@/model/richText';

export const accordionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  doc: richTextDocSchema,
});
export type AccordionItem = z.infer<typeof accordionItemSchema>;

export const accordionContentSchema = z.object({
  items: z.array(accordionItemSchema),
  /** single = פתיחת פריט אחד סוגרת את האחרים */
  mode: z.enum(['single', 'multiple']),
  openFirstByDefault: z.boolean(),
});

export type AccordionContent = z.infer<typeof accordionContentSchema>;

export const createAccordionItem = (overrides: Partial<AccordionItem> = {}): AccordionItem => ({
  id: createId('item'),
  title: 'שאלה או נושא',
  doc: emptyRichText(),
  ...overrides,
});

export const createAccordionContent = (
  overrides: Partial<AccordionContent> = {},
): AccordionContent => ({
  items: [createAccordionItem(), createAccordionItem()],
  mode: 'single',
  openFirstByDefault: false,
  ...overrides,
});

export const accordionAssetIds = (): string[] => [];
