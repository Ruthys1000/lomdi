import { blockAssetIds, blockLabel } from '@/blocks/registry.shared';
import type { VideoContent } from '@/blocks/video/content';
import { videoEmbedUrl } from '@/blocks/video/embed';
import { collectCourseAssetIds, unusedAssets } from '@/model/assets';
import type { AssetMeta, Course } from '@/model/types';
import { formatBytes } from '@/persistence/assetNaming';

/**
 * מה ייכנס לתוצר, ומה כדאי לדעת לפניו.
 *
 * מודול טהור: אין בו React, אין stores ואין ZIP — ולכן אפשר לבדוק כל
 * אזהרה בנפרד. הוא רץ לפני הייצוא ולא אחריו, כי לומדה שמפנה לנכס חסר או
 * שנשענת על יוטיוב היא בדיוק מה שהמשתמש מגלה רק אצל הלומד.
 *
 * אף אזהרה אינה חוסמת ייצוא. לומדה חלקית עדיין שווה יותר מאשר כפתור
 * מושבת בלי הסבר.
 */

export interface ExportSummary {
  chapterCount: number;
  blockCount: number;
  /** נכסים שייארזו — כלומר אלה שבלוק כלשהו מפנה אליהם */
  assetCount: number;
  assetBytes: number;
  /** אומדן גס למשקל ההורדה: מדיה + חבילת ריצה דחוסה + גופן (אם נארז) */
  estimatedBytes: number;
  warnings: string[];
}

// אומדנים גסים למשקל הרכיבים הקבועים בארכיון הדחוס. app.js+styles מתכווצים
// חזק ב-DEFLATE (gzip ~79KB), וקובצי ה-woff2 כבר דחוסים ולכן נשארים כמות
// שהם. המספרים נועדו לתת סדר-גודל למשתמש, לא דיוק לבייט.
const RUNTIME_COMPRESSED_BYTES = 80_000;
const FONT_COMPRESSED_BYTES = 50_000;

/** רשימה קריאה בעברית, עם קיצור אחרי שלושה פריטים */
function joinNames(names: string[], limit = 3): string {
  const shown = names.slice(0, limit).map((name) => `"${name}"`);
  const rest = names.length - shown.length;
  return rest > 0 ? `${shown.join(', ')} ועוד ${rest}` : shown.join(', ');
}

export function summarizeExport(course: Course, assets: AssetMeta[]): ExportSummary {
  const known = new Set(assets.map((asset) => asset.id));
  const used = collectCourseAssetIds(course);
  const packed = assets.filter((asset) => used.has(asset.id));

  const warnings: string[] = [];
  const missingIn: string[] = [];
  const emptyChapters: string[] = [];
  let externalVideos = 0;
  let brokenVideos = 0;
  let emptyVideos = 0;
  let blockCount = 0;

  for (const chapter of course.chapters) {
    if (chapter.blocks.length === 0) emptyChapters.push(chapter.title);
    blockCount += chapter.blocks.length;

    for (const block of chapter.blocks) {
      if (blockAssetIds(block.type, block.content).some((id) => id && !known.has(id))) {
        missingIn.push(blockLabel(block.type));
      }

      if (block.type !== 'video') continue;
      const content = block.content as VideoContent;
      if (content.source !== 'youtube' && content.source !== 'vimeo') continue;

      // שלושה מצבים שונים, ולכל אחד אזהרה משלו — סרטון שלא ייטען בשום
      // מקרה אינו "דורש חיבור לאינטרנט", ובלוק בלי קישור אינו קישור שגוי
      if (!content.url.trim()) emptyVideos++;
      else if (videoEmbedUrl(content)) externalVideos++;
      else brokenVideos++;
    }
  }

  if (course.chapters.length === 0) {
    warnings.push('אין בלומדה פרקים, והתוצר יהיה עמוד ריק.');
  }

  if (emptyChapters.length > 0) {
    warnings.push(
      `${emptyChapters.length === 1 ? 'הפרק' : 'הפרקים'} ${joinNames(emptyChapters)} ${
        emptyChapters.length === 1 ? 'ריק ויופיע' : 'ריקים ויופיעו'
      } בלומדה בלי תוכן.`,
    );
  }

  if (missingIn.length > 0) {
    warnings.push(
      `${missingIn.length} בלוקים (${joinNames([...new Set(missingIn)])}) מפנים לנכס שאינו בספרייה. המדיה שלהם לא תופיע בלומדה.`,
    );
  }

  if (externalVideos > 0) {
    warnings.push(
      `${externalVideos === 1 ? 'סרטון אחד מוטמע' : `${externalVideos} סרטונים מוטמעים`} מיוטיוב או מ-Vimeo, ולכן ${
        externalVideos === 1 ? 'הוא ידרוש' : 'הם ידרשו'
      } חיבור לאינטרנט בזמן הצפייה. סרטון שהועלה לספרייה נארז לתוך ה-ZIP ועובד גם בלי רשת.`,
    );
  }

  if (brokenVideos > 0) {
    warnings.push(
      `${brokenVideos === 1 ? 'בסרטון אחד הקישור אינו מזוהה' : `ב-${brokenVideos} סרטונים הקישור אינו מזוהה`} ולא ניתן להטמיע אותו.`,
    );
  }

  if (emptyVideos > 0) {
    warnings.push(
      emptyVideos === 1
        ? 'בלוק וידאו אחד עדיין בלי קישור ויופיע ריק בלומדה.'
        : `${emptyVideos} בלוקי וידאו עדיין בלי קישור ויופיעו ריקים בלומדה.`,
    );
  }

  const unused = unusedAssets(course, assets);
  if (unused.length > 0) {
    const bytes = unused.reduce((sum, asset) => sum + asset.size, 0);
    warnings.push(
      `${unused.length} נכסים בספרייה אינם בשימוש ולא ייארזו לתוצר (${formatBytes(bytes)}).`,
    );
  }

  const assetBytes = packed.reduce((sum, asset) => sum + asset.size, 0);
  // הגופן נארז רק כשהערכה אינה משתמשת בגופן המערכת
  const fontBytes =
    course.theme.typography.fontFamily === 'system' ? 0 : FONT_COMPRESSED_BYTES;

  return {
    chapterCount: course.chapters.length,
    blockCount,
    assetCount: packed.length,
    assetBytes,
    estimatedBytes: assetBytes + RUNTIME_COMPRESSED_BYTES + fontBytes,
    warnings,
  };
}
