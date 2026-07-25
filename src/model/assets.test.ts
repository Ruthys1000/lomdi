import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse } from './factory';
import { assetUsageCount, collectCourseAssetIds, unusedAssets } from './assets';
import type { AssetMeta, Course } from './types';

const asset = (id: string): AssetMeta => ({
  id,
  originalName: 'תמונה.png',
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size: 1024,
  exportPath: `assets/images/${id}.png`,
});

const courseWith = (...blocks: ReturnType<typeof createBlock>[]): Course =>
  createCourse({ chapters: [createChapter({ blocks })] });

describe('איסוף נכסים מהלומדה', () => {
  it('אוסף מכל סוגי הבלוקים שמחזיקים מדיה', () => {
    const course = courseWith(
      createBlock('image', { content: { ...createBlock('image').content, assetId: 'asset-image' } }),
      createBlock('hero', {
        content: {
          ...createBlock('hero').content,
          backgroundType: 'image',
          imageAssetId: 'asset-hero',
        },
      }),
      createBlock('textImage', {
        content: { ...createBlock('textImage').content, imageAssetId: 'asset-side' },
      }),
    );

    expect(collectCourseAssetIds(course)).toEqual(
      new Set(['asset-image', 'asset-hero', 'asset-side']),
    );
  });

  it('מדלג על נכס שהבלוק מחזיק אבל אינו מציג בפועל', () => {
    // הירו עם רקע מדורג עדיין מחזיק imageAssetId מהפעם שבה נבחרה תמונה.
    // ארזיזת הקובץ הזה לתוצר הייתה מוסיפה מגה-בייטים שאיש אינו רואה.
    const hero = createBlock('hero', {
      content: {
        ...createBlock('hero').content,
        backgroundType: 'gradient',
        imageAssetId: 'asset-hidden',
      },
    });

    // אותו היגיון בווידאו: מקור יוטיוב מתעלם מקובץ שהועלה
    const video = createBlock('video', {
      content: { ...createBlock('video').content, source: 'youtube', assetId: 'asset-unused-video' },
    });

    expect(collectCourseAssetIds(courseWith(hero, video)).size).toBe(0);
  });

  it('אוסף את תמונות הכרטיסים רק כשהמדיה שלהם היא תמונה', () => {
    const content = createBlock('cards').content as { items: { imageAssetId: string }[] };
    const items = content.items.map((item, index) => ({ ...item, imageAssetId: `asset-${index}` }));

    const asIcons = createBlock('cards', { content: { ...content, items, media: 'icon' } });
    const asImages = createBlock('cards', { content: { ...content, items, media: 'image' } });

    expect(collectCourseAssetIds(courseWith(asIcons)).size).toBe(0);
    expect(collectCourseAssetIds(courseWith(asImages)).size).toBe(items.length);
  });

  it('סופר כמה בלוקים משתמשים באותו נכס', () => {
    const withAsset = () =>
      createBlock('image', { content: { ...createBlock('image').content, assetId: 'asset-shared' } });

    expect(assetUsageCount(courseWith(withAsset(), withAsset()), 'asset-shared')).toBe(2);
    expect(assetUsageCount(courseWith(withAsset()), 'asset-other')).toBe(0);
  });

  it('מזהה נכסים שאף בלוק אינו מפנה אליהם', () => {
    const course = courseWith(
      createBlock('image', { content: { ...createBlock('image').content, assetId: 'asset-used' } }),
    );

    expect(unusedAssets(course, [asset('asset-used'), asset('asset-orphan')])).toEqual([
      asset('asset-orphan'),
    ]);
  });
});
