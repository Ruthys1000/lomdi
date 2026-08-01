import { describe, expect, it, vi } from 'vitest';
import type { AssetMeta } from '@/model/types';
import { coerceGeneratedCourse } from './coerceCourse';
import { resolveImageIntents } from './images';

function fakeMeta(id: string): AssetMeta {
  return {
    id,
    originalName: 'x.png',
    safeName: `${id}.png`,
    kind: 'image',
    mimeType: 'image/png',
    size: 10,
    exportPath: `assets/images/${id}.png`,
  };
}

const courseWith = (content: Record<string, unknown>) =>
  coerceGeneratedCourse({ chapters: [{ blocks: [{ type: 'image', content }] }] });

describe('resolveImageIntents', () => {
  it('פותרת כתובת ישירה ומצמידה את הנכס לבלוק', async () => {
    const { course, imageIntents } = courseWith({ url: 'https://ex.com/a.png', alt: 'תיאור' });
    const importFromUrl = vi.fn(async () => ({ ok: true as const, meta: fakeMeta('asset-aaa'), blob: new Blob() }));

    const result = await resolveImageIntents(course, imageIntents, { importFromUrl });

    expect(importFromUrl).toHaveBeenCalledWith('https://ex.com/a.png', 'תיאור');
    expect((result.course.chapters[0].blocks[0].content as { assetId: string }).assetId).toBe('asset-aaa');
    expect((result.course.chapters[0].blocks[0].content as { alt: string }).alt).toBe('תיאור');
    expect(result.assets).toHaveLength(1);
  });

  it('משתמשת ב-resolver כדי להמיר תיאור לכתובת', async () => {
    const { course, imageIntents } = courseWith({ query: 'חתול' });
    const resolver = { resolve: vi.fn(async () => 'https://ex.com/cat.png') };
    const importFromUrl = vi.fn(async () => ({ ok: true as const, meta: fakeMeta('asset-cat'), blob: new Blob() }));

    const result = await resolveImageIntents(course, imageIntents, { resolver, importFromUrl });

    expect(resolver.resolve).toHaveBeenCalledWith('חתול');
    expect((result.course.chapters[0].blocks[0].content as { assetId: string }).assetId).toBe('asset-cat');
  });

  it('נופלת חזרה לאיור מציב-מקום כשאין מה לפתור', async () => {
    const { course, imageIntents } = courseWith({ query: 'משהו' });

    const result = await resolveImageIntents(course, imageIntents, {}); // בלי resolver

    const assetId = (result.course.chapters[0].blocks[0].content as { assetId: string }).assetId;
    expect(assetId).not.toBe('');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].meta.mimeType).toBe('image/svg+xml');
  });

  it('fallback=null משאיר את הבלוק בלי תמונה', async () => {
    const { course, imageIntents } = courseWith({ query: 'משהו' });

    const result = await resolveImageIntents(course, imageIntents, { fallback: null });

    expect((result.course.chapters[0].blocks[0].content as { assetId: string }).assetId).toBe('');
    expect(result.assets).toHaveLength(0);
  });

  it('מדווחת אזהרה כשהורדת התמונה נכשלת', async () => {
    const { course, imageIntents } = courseWith({ url: 'https://ex.com/a.png' });
    const importFromUrl = vi.fn(async () => ({ ok: false as const, error: 'שגיאה 404' }));

    const result = await resolveImageIntents(course, imageIntents, { importFromUrl, fallback: null });

    expect(result.warnings.some((w) => w.includes('404'))).toBe(true);
  });

  it('כשל 404 שפיר אינו מגדיר providerError (רק אזהרה)', async () => {
    const { course, imageIntents } = courseWith({ query: 'משהו' });
    const importFromUrl = vi.fn(async () => ({
      ok: false as const,
      error: 'לא נמצאה תמונה מתאימה.',
      status: 404,
    }));
    const resolver = { resolve: vi.fn(async () => '/api/image?q=x') };

    const result = await resolveImageIntents(course, imageIntents, { importFromUrl, resolver });

    expect(result.providerError).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
  });

  it('כשל אקציוני (500/502) מגדיר providerError', async () => {
    const { course, imageIntents } = courseWith({ query: 'משהו' });
    const importFromUrl = vi.fn(async () => ({
      ok: false as const,
      error: 'ספק התמונות לא הוגדר בשרת.',
      status: 500,
    }));
    const resolver = { resolve: vi.fn(async () => '/api/image?q=x') };

    const result = await resolveImageIntents(course, imageIntents, { importFromUrl, resolver });

    expect(result.providerError).toBe('ספק התמונות לא הוגדר בשרת.');
  });
});
