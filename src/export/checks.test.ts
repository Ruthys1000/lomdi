import { describe, expect, it } from 'vitest';
import { createVideoContent } from '@/blocks/video/content';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta, BlockContent } from '@/model/types';
import { summarizeExport } from './checks';

const asset = (id: string, size = 1024): AssetMeta => ({
  id,
  originalName: `${id}.png`,
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size,
  exportPath: `assets/images/${id}.png`,
});

const imageBlock = (assetId: string) =>
  createBlock('image', { content: { ...createBlock('image').content, assetId } });

const videoBlock = (content: Partial<ReturnType<typeof createVideoContent>>) =>
  createBlock('video', { content: createVideoContent(content) as unknown as BlockContent });

const courseWith = (...blocks: ReturnType<typeof createBlock>[]) =>
  createCourse({ chapters: [createChapter({ title: 'פרק ראשון', blocks })] });

describe('סיכום הייצוא', () => {
  it('סופר פרקים, בלוקים ונכסים שבשימוש', () => {
    const course = createCourse({
      chapters: [
        createChapter({ title: 'א', blocks: [imageBlock('asset-a'), createBlock('richText')] }),
        createChapter({ title: 'ב', blocks: [createBlock('divider')] }),
      ],
    });

    const summary = summarizeExport(course, [asset('asset-a', 2048), asset('asset-b')]);

    expect(summary.chapterCount).toBe(2);
    expect(summary.blockCount).toBe(3);
    // asset-b אינו בשימוש ולכן אינו נספר במשקל התוצר
    expect(summary.assetCount).toBe(1);
    expect(summary.assetBytes).toBe(2048);
  });

  it('לומדה תקינה אינה מייצרת אזהרות', () => {
    const summary = summarizeExport(courseWith(imageBlock('asset-a')), [asset('asset-a')]);

    expect(summary.warnings).toEqual([]);
  });
});

describe('אזהרות לפני ייצוא', () => {
  it('מזהירה על בלוק שמפנה לנכס שאינו בספרייה', () => {
    const summary = summarizeExport(courseWith(imageBlock('asset-missing')), []);

    expect(summary.warnings.join(' ')).toContain('מפנים לנכס שאינו בספרייה');
    expect(summary.warnings.join(' ')).toContain('תמונה');
  });

  it('מזהירה שסרטון מיוטיוב דורש אינטרנט', () => {
    const summary = summarizeExport(
      courseWith(videoBlock({ source: 'youtube', url: 'https://youtu.be/abcdefghijk' })),
      [],
    );

    expect(summary.warnings.join(' ')).toContain('חיבור לאינטרנט');
  });

  it('אינה מזהירה על סרטון שהועלה לספרייה — הוא נארז לתוך ה-ZIP', () => {
    const summary = summarizeExport(
      courseWith(videoBlock({ source: 'upload', assetId: 'asset-v' })),
      [{ ...asset('asset-v'), kind: 'video', mimeType: 'video/mp4', exportPath: 'assets/videos/asset-v.mp4' }],
    );

    expect(summary.warnings).toEqual([]);
  });

  it('מזהירה על קישור וידאו שאינו מזוהה, ולא מוסיפה עליו גם אזהרת אינטרנט', () => {
    const summary = summarizeExport(
      courseWith(videoBlock({ source: 'youtube', url: 'https://example.com/movie' })),
      [],
    );

    expect(summary.warnings.join(' ')).toContain('אינו מזוהה');
    // סרטון שלא ייטען בשום מקרה אינו "דורש חיבור לאינטרנט" — שתי אזהרות
    // על אותו בלוק היו נראות כמו שתי תקלות
    expect(summary.warnings.join(' ')).not.toContain('חיבור לאינטרנט');
  });

  it('מבדילה בין בלוק וידאו בלי קישור לבין קישור שגוי', () => {
    const summary = summarizeExport(courseWith(videoBlock({ source: 'youtube', url: '' })), []);

    expect(summary.warnings.join(' ')).toContain('בלי קישור');
    expect(summary.warnings.join(' ')).not.toContain('אינו מזוהה');
    expect(summary.warnings.join(' ')).not.toContain('חיבור לאינטרנט');
  });

  it('מזהירה על נכסים שאינם בשימוש ולא ייארזו', () => {
    const summary = summarizeExport(courseWith(createBlock('richText')), [asset('asset-x', 4096)]);

    expect(summary.warnings.join(' ')).toContain('אינם בשימוש');
    expect(summary.warnings.join(' ')).toContain('4 KB');
  });

  it('מזהירה על פרק ריק', () => {
    const course = createCourse({ chapters: [createChapter({ title: 'פרק ריק' })] });

    expect(summarizeExport(course, []).warnings.join(' ')).toContain('"פרק ריק"');
  });

  it('מזהירה על לומדה בלי פרקים בכלל', () => {
    const summary = summarizeExport(createCourse({ chapters: [] }), []);

    expect(summary.warnings.join(' ')).toContain('אין בלומדה פרקים');
  });
});
