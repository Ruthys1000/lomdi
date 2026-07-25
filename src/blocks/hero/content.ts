import { z } from 'zod';
import { assetRefSchema, buttonSchema, collectAssetIds, createButton } from '../shared';

export const heroContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  intro: z.string(),
  backgroundType: z.enum(['color', 'gradient', 'image']),
  backgroundColor: z.string(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  imageAssetId: assetRefSchema,
  /** כהות שכבת הכיסוי מעל תמונת רקע — שומרת על קריאות הכותרת */
  overlayOpacity: z.number().min(0).max(1),
  height: z.enum(['compact', 'medium', 'tall', 'screen']),
  alignment: z.enum(['start', 'center', 'end']),
  fullBleed: z.boolean(),
  button: buttonSchema,
});

export type HeroContent = z.infer<typeof heroContentSchema>;

export const createHeroContent = (overrides: Partial<HeroContent> = {}): HeroContent => ({
  title: 'כותרת הלומדה',
  subtitle: 'כותרת משנה קצרה שמסבירה על מה הלומדה',
  intro: '',
  backgroundType: 'gradient',
  backgroundColor: '#2563eb',
  gradientFrom: '#2563eb',
  gradientTo: '#7c3aed',
  imageAssetId: '',
  overlayOpacity: 0.45,
  height: 'medium',
  alignment: 'center',
  fullBleed: true,
  button: createButton(),
  ...overrides,
});

export const heroAssetIds = (content: HeroContent): string[] =>
  collectAssetIds(content.backgroundType === 'image' ? content.imageAssetId : undefined);
