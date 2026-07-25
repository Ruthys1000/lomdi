import { z } from 'zod';
import { aspectRatioSchema, assetRefSchema, collectAssetIds, roundnessSchema } from '../shared';

export const imageContentSchema = z.object({
  assetId: assetRefSchema,
  /** טקסט חלופי — נדרש לנגישות (סעיף 18) */
  alt: z.string(),
  caption: z.string(),
  aspectRatio: aspectRatioSchema,
  fit: z.enum(['cover', 'contain']),
  roundness: roundnessSchema,
  /** לחיצה פותחת את התמונה בגודל מלא */
  lightbox: z.boolean(),
});

export type ImageContent = z.infer<typeof imageContentSchema>;

export const createImageContent = (overrides: Partial<ImageContent> = {}): ImageContent => ({
  assetId: '',
  alt: '',
  caption: '',
  aspectRatio: 'auto',
  fit: 'cover',
  roundness: 'medium',
  lightbox: true,
  ...overrides,
});

export const imageAssetIds = (content: ImageContent): string[] => collectAssetIds(content.assetId);
