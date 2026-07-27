import { z } from 'zod';
import { createId } from '@/model/ids';
import { assetRefSchema, buttonSchema, createButton, roundnessSchema } from '../shared';

export const cardSchema = z.object({
  id: z.string(),
  /** שם אייקון מ-lucide, או ריק אם משתמשים בתמונה */
  icon: z.string(),
  imageAssetId: assetRefSchema,
  title: z.string(),
  text: z.string(),
  button: buttonSchema,
});
export type CardItem = z.infer<typeof cardSchema>;

/**
 * וריאציית עיצוב של הכרטיסים. `.default` שומר על תאימות אחורה: קובץ ישן
 * בלי השדה נטען כ-'plain'.
 */
export const cardsVariantSchema = z
  .enum(['plain', 'numbered', 'gradient', 'outline'])
  .default('plain');
export type CardsVariant = z.infer<typeof cardsVariantSchema>;

export const cardsContentSchema = z.object({
  variant: cardsVariantSchema,
  items: z.array(cardSchema),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  media: z.enum(['icon', 'image', 'none']),
  roundness: roundnessSchema,
  textAlign: z.enum(['start', 'center']),
});

export type CardsContent = z.infer<typeof cardsContentSchema>;

export const createCard = (overrides: Partial<CardItem> = {}): CardItem => ({
  id: createId('card'),
  icon: 'Sparkles',
  imageAssetId: '',
  title: 'כותרת הכרטיס',
  text: 'תיאור קצר שמסביר את הרעיון בכרטיס הזה.',
  button: createButton(),
  ...overrides,
});

export const createCardsContent = (overrides: Partial<CardsContent> = {}): CardsContent => ({
  variant: 'plain',
  items: [createCard(), createCard(), createCard()],
  columns: 3,
  media: 'icon',
  roundness: 'medium',
  textAlign: 'start',
  ...overrides,
});

export const cardsAssetIds = (content: CardsContent): string[] =>
  content.media === 'image'
    ? content.items.map((item) => item.imageAssetId).filter(Boolean)
    : [];
