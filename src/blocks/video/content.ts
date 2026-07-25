import { z } from 'zod';
import { aspectRatioSchema, assetRefSchema, collectAssetIds, roundnessSchema } from '../shared';

/**
 * וידאו הוא המקום היחיד שבו התוצר עשוי לפנות לאינטרנט, ורק אם המשתמש
 * בחר בכך במפורש (סעיף 17). קובץ שהועלה מקומית נארז לתוך ה-ZIP ונטען
 * מנתיב יחסי.
 */
export const videoContentSchema = z.object({
  source: z.enum(['youtube', 'vimeo', 'upload']),
  url: z.string(),
  assetId: assetRefSchema,
  posterAssetId: assetRefSchema,
  caption: z.string(),
  aspectRatio: aspectRatioSchema,
  roundness: roundnessSchema,
  /** כבוי כברירת מחדל — הפעלה אוטומטית פוגעת בנגישות ובחוויית הלומד */
  autoplay: z.boolean(),
  controls: z.boolean(),
  loop: z.boolean(),
  muted: z.boolean(),
});

export type VideoContent = z.infer<typeof videoContentSchema>;

export const createVideoContent = (overrides: Partial<VideoContent> = {}): VideoContent => ({
  source: 'youtube',
  url: '',
  assetId: '',
  posterAssetId: '',
  caption: '',
  aspectRatio: '16:9',
  roundness: 'medium',
  autoplay: false,
  controls: true,
  loop: false,
  muted: false,
  ...overrides,
});

export const videoAssetIds = (content: VideoContent): string[] =>
  collectAssetIds(content.source === 'upload' ? content.assetId : undefined, content.posterAssetId);

// עוזרי הכתובות חיים ב-embed.ts, מודול נטול תלויות. ה-Renderer מייבא
// אותם משם ולא מכאן — ייבוא ערך מקובץ שמייבא zod היה גורר את zod כולו
// לתוך חבילת הלומדה.
export { parseYouTubeId, parseVimeoId, videoEmbedUrl } from './embed';
