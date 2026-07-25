import type { VideoContent } from './content';

/**
 * חילוץ מזהי וידאו ובניית כתובת ההטמעה.
 *
 * המודול הזה מופרד מ-content.ts בכוונה, והוא נטול תלויות: ה-Renderer של
 * הווידאו זקוק ל-videoEmbedUrl כערך ולא כטיפוס, ולכן ייבוא ממנו גורר גם
 * את כל מה שהמודול המקורי מייבא. content.ts מייבא את zod — וכך כל ספריית
 * הסכמות נכנסה לחבילת הלומדה שהלומד מוריד.
 *
 * הטיפוס VideoContent מיובא כאן כ-type בלבד ולכן נמחק בקומפילציה, ואינו
 * מחזיר את התלות דרך הדלת האחורית.
 */

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
