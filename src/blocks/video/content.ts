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

// ─────────── חילוץ מזהה סרטון מכתובות בפורמטים הנפוצים ───────────

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
];

export function parseYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }
  return null;
}

export function parseVimeoId(url: string): string | null {
  const match = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  return match ? match[1] : null;
}

/** כתובת ההטמעה, או null אם הקישור אינו מזוהה */
export function videoEmbedUrl(content: VideoContent): string | null {
  if (content.source === 'youtube') {
    const id = parseYouTubeId(content.url);
    if (!id) return null;
    // nocookie מפחית מעקב אחר הלומד; הפרמטרים משקפים את הגדרות הבלוק
    const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
    if (content.autoplay) params.set('autoplay', '1');
    if (content.loop) params.set('loop', '1');
    return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
  }

  if (content.source === 'vimeo') {
    const id = parseVimeoId(content.url);
    if (!id) return null;
    const params = new URLSearchParams({ dnt: '1' });
    if (content.autoplay) params.set('autoplay', '1');
    if (content.loop) params.set('loop', '1');
    return `https://player.vimeo.com/video/${id}?${params}`;
  }

  return null;
}
