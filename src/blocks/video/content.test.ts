import { describe, expect, it } from 'vitest';
import { createVideoContent, parseVimeoId, parseYouTubeId, videoEmbedUrl } from './content';

describe('זיהוי קישורי וידאו', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?t=30&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('מזהה מזהה יוטיוב מתוך %s', (url, expected) => {
    expect(parseYouTubeId(url)).toBe(expected);
  });

  it('מחזיר null לקישור שאינו יוטיוב', () => {
    expect(parseYouTubeId('https://example.com/video')).toBeNull();
    expect(parseYouTubeId('')).toBeNull();
  });

  it.each([
    ['https://vimeo.com/123456789', '123456789'],
    ['https://vimeo.com/video/123456789', '123456789'],
  ])('מזהה מזהה Vimeo מתוך %s', (url, expected) => {
    expect(parseVimeoId(url)).toBe(expected);
  });
});

describe('כתובת ההטמעה', () => {
  it('בונה כתובת יוטיוב ללא עוגיות מעקב', () => {
    const url = videoEmbedUrl(
      createVideoContent({ source: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' }),
    );

    expect(url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(url).toContain('rel=0');
  });

  it('לא מוסיף autoplay כשהוא כבוי — וזו ברירת המחדל', () => {
    const content = createVideoContent({
      source: 'youtube',
      url: 'https://youtu.be/dQw4w9WgXcQ',
    });

    expect(content.autoplay).toBe(false);
    expect(videoEmbedUrl(content)).not.toContain('autoplay');
  });

  it('מוסיף autoplay רק כשהמשתמש הפעיל אותו במפורש', () => {
    const url = videoEmbedUrl(
      createVideoContent({ source: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', autoplay: true }),
    );

    expect(url).toContain('autoplay=1');
  });

  it('מחזיר null לקישור לא מזוהה, כדי שהבלוק יציג מצב ריק ולא iframe שבור', () => {
    expect(videoEmbedUrl(createVideoContent({ source: 'youtube', url: 'לא קישור' }))).toBeNull();
  });

  it('מחזיר null לקובץ שהועלה — הוא מנוגן ישירות ולא ב-iframe', () => {
    expect(videoEmbedUrl(createVideoContent({ source: 'upload', assetId: 'asset-1' }))).toBeNull();
  });
});
