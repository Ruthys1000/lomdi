import { z } from 'zod';
import { createId } from '@/model/ids';

export const statSchema = z.object({
  id: z.string(),
  /** הערך הגדול — מחרוזת ולא מספר, כדי לאפשר "‎+40%", "‎24/7", "‎3 דק׳" */
  value: z.string(),
  label: z.string(),
  sub: z.string(),
});
export type StatItem = z.infer<typeof statSchema>;

/**
 * וריאציית עיצוב. `.default` שומר על תאימות אחורה.
 */
export const statsVariantSchema = z.enum(['plain', 'gradient', 'cards']).default('plain');
export type StatsVariant = z.infer<typeof statsVariantSchema>;

export const statsContentSchema = z.object({
  variant: statsVariantSchema,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  items: z.array(statSchema),
});

export type StatsContent = z.infer<typeof statsContentSchema>;

export const createStat = (overrides: Partial<StatItem> = {}): StatItem => ({
  id: createId('stat'),
  value: '100%',
  label: 'כותרת המספר',
  sub: 'הסבר קצר של מה שהמספר מייצג',
  ...overrides,
});

export const createStatsContent = (overrides: Partial<StatsContent> = {}): StatsContent => ({
  variant: 'plain',
  columns: 3,
  items: [createStat(), createStat(), createStat()],
  ...overrides,
});

export const statsAssetIds = (): string[] => [];
