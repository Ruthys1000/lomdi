import { z } from 'zod';

export const dividerContentSchema = z.object({
  style: z.enum(['space', 'line', 'icon', 'gradient']),
  /** שם אייקון מ-lucide, רלוונטי כשה-style הוא icon */
  icon: z.string(),
  height: z.enum(['small', 'medium', 'large']),
  lineWidth: z.enum(['short', 'half', 'full']),
});

export type DividerContent = z.infer<typeof dividerContentSchema>;

export const createDividerContent = (overrides: Partial<DividerContent> = {}): DividerContent => ({
  style: 'line',
  icon: 'Sparkle',
  height: 'medium',
  lineWidth: 'full',
  ...overrides,
});

export const dividerAssetIds = (): string[] => [];
