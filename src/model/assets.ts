import { blockAssetIds } from '@/blocks/registry.shared';
import type { AssetMeta, Course } from './types';

/**
 * מי משתמש באילו נכסים.
 *
 * התשובה מורכבת יותר מ"סרוק את כל השדות ששמם assetId": בלוק כרטיסים
 * מחזיק `imageAssetId` בכל כרטיס גם כשהוא מציג אייקונים, ובלוק וידאו
 * מחזיק `assetId` גם כשהמקור הוא יוטיוב. לכן השאלה מופנית ל-`usedAssetIds`
 * של כל בלוק ברגיסטרי המשותף, שיודע לקרוא את המצב שלו — ולא לסריקה
 * גנרית שהייתה גוררת לייצוא קבצים שאיש אינו רואה.
 *
 * זהו גם הבסיס לאיסוף הנכסים בייצוא בשלב 7.
 */
export function collectCourseAssetIds(course: Course): Set<string> {
  const ids = new Set<string>();

  for (const chapter of course.chapters) {
    for (const block of chapter.blocks) {
      for (const id of blockAssetIds(block.type, block.content)) {
        if (id) ids.add(id);
      }
    }
  }

  return ids;
}

/** בכמה בלוקים נכס מסוים מופיע — לתצוגה לפני מחיקה */
export function assetUsageCount(course: Course, assetId: string): number {
  if (!assetId) return 0;

  let count = 0;
  for (const chapter of course.chapters) {
    for (const block of chapter.blocks) {
      if (blockAssetIds(block.type, block.content).includes(assetId)) count++;
    }
  }
  return count;
}

/** הנכסים שאף בלוק אינו מפנה אליהם — מסומנים בספרייה ואינם נארזים לתוצר */
export function unusedAssets(course: Course, assets: AssetMeta[]): AssetMeta[] {
  const used = collectCourseAssetIds(course);
  return assets.filter((asset) => !used.has(asset.id));
}
