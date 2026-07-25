import { describe, expect, it } from 'vitest';
import { assetMetaSchema } from '@/model/schema';
import {
  SIZE_LIMITS,
  assetKindFor,
  buildAssetMeta,
  checkAssetFile,
  extensionFor,
  formatBytes,
} from './assetNaming';

describe('סיווג נכסים', () => {
  it('מזהה תמונות וסרטונים ודוחה את השאר', () => {
    expect(assetKindFor('image/png')).toBe('image');
    expect(assetKindFor('image/svg+xml')).toBe('image');
    expect(assetKindFor('video/mp4')).toBe('video');
    expect(assetKindFor('application/pdf')).toBeNull();
    expect(assetKindFor('')).toBeNull();
  });

  it('גוזר סיומת מה-MIME ולא משם הקובץ', () => {
    expect(extensionFor('image/jpeg')).toBe('.jpg');
    expect(extensionFor('video/webm')).toBe('.webm');
  });
});

describe('בניית מטא-דאטה של נכס', () => {
  it('מייצר שם פנימי לטיני גם לשם קובץ בעברית', () => {
    const meta = buildAssetMeta({
      originalName: 'לוגו החברה (סופי) 2024.png',
      mimeType: 'image/png',
      size: 2048,
    });

    // הסכמה דורשת ^[A-Za-z0-9._-]+$ — שם עברי היה נדחה כאן ולא בייצוא
    expect(assetMetaSchema.safeParse(meta).success).toBe(true);
    expect(meta.safeName).toMatch(/^asset-[a-z0-9]+\.png$/);
    expect(meta.exportPath).toBe(`assets/images/${meta.safeName}`);
    expect(meta.originalName).toBe('לוגו החברה (סופי) 2024.png');
  });

  it('מפריד תמונות מסרטונים לתיקיות שונות בתוצר', () => {
    const video = buildAssetMeta({ originalName: 'clip.mp4', mimeType: 'video/mp4', size: 10 });
    expect(video.exportPath).toBe(`assets/videos/${video.safeName}`);
    expect(video.kind).toBe('video');
  });

  it('משמר מזהה קיים, כדי שייבוא לא ינתק בלוקים מהנכסים שלהם', () => {
    const meta = buildAssetMeta({
      id: 'asset-existing1',
      originalName: 'a.png',
      mimeType: 'image/png',
      size: 1,
    });

    expect(meta.id).toBe('asset-existing1');
    expect(meta.exportPath).toBe('assets/images/asset-existing1.png');
  });

  it('משמיט ממדים כשאינם ידועים במקום לכתוב אפס', () => {
    const meta = buildAssetMeta({ originalName: 'a.png', mimeType: 'image/png', size: 1 });
    expect(meta.width).toBeUndefined();
    expect(assetMetaSchema.safeParse(meta).success).toBe(true);
  });
});

describe('בדיקת קובץ לפני העלאה', () => {
  it('מקבל תמונה תקינה', () => {
    expect(checkAssetFile({ name: 'a.png', type: 'image/png', size: 1000 })).toEqual({
      ok: true,
      kind: 'image',
    });
  });

  it('דוחה סוג שאינו נתמך בהודעה שמזכירה את שם הקובץ', () => {
    const result = checkAssetFile({ name: 'מסמך.pdf', type: 'application/pdf', size: 1000 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('מסמך.pdf');
  });

  it('דוחה קובץ שחורג מהמגבלה', () => {
    const result = checkAssetFile({
      name: 'big.png',
      type: 'image/png',
      size: SIZE_LIMITS.image + 1,
    });

    expect(result.ok).toBe(false);
  });

  it('דוחה קובץ ריק', () => {
    expect(checkAssetFile({ name: 'a.png', type: 'image/png', size: 0 }).ok).toBe(false);
  });
});

describe('הצגת גדלים', () => {
  it('עוברת ליחידות קריאות', () => {
    expect(formatBytes(512)).toBe('512 בתים');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
