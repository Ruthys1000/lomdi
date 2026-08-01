import { buildAssetMeta } from '@/persistence/assetNaming';
import { importAssetFromUrl, type ImportAssetResult } from '@/persistence/importAsset';
import type { AssetMeta, Block, Course, Theme } from '@/model/types';
import type { ImageIntent } from './imageIntent';

/**
 * פתירת כוונות תמונה למול מקור חיצוני.
 *
 * זהו התפר, לא הספק: המודול מקבל `resolver` שממיר תיאור לכתובת (סטוק, AI
 * images, כל דבר) ו-`importFromUrl` שמושך אותה לנכס — ומזין את התוצאה
 * חזרה לבלוקים. הפרדת התפר מהספק היא בכוונה: החלטת הארכיטקטורה ("מי קורא
 * ל-LLM ומאיפה מגיעות התמונות") נותרה פתוחה, והקוד כאן עובד עם כל מימוש
 * שיוזרק. כשאין פתרון — איור מציב-מקום מבטיח שהבלוק לעולם לא שבור.
 */

export interface ResolvedAsset {
  meta: AssetMeta;
  blob: Blob;
}

export interface ImageResolver {
  /** מחזיר כתובת תמונה עבור תיאור, או null אם אין התאמה */
  resolve(query: string): Promise<string | null>;
}

export interface ResolveImageIntentsOptions {
  resolver?: ImageResolver;
  /** ברירת מחדל: `importAssetFromUrl`. ניתן להזרקה בבדיקות */
  importFromUrl?: (url: string, originalName?: string) => Promise<ImportAssetResult>;
  /**
   * מה לעשות כשאין מה לפתור או שהפתירה נכשלה. ברירת מחדל: איור מציב-מקום.
   * העברת `null` מכבה את הנפילה-חזרה ומשאירה את הבלוק בלי תמונה.
   */
  fallback?: ((intent: ImageIntent, theme: Theme) => ResolvedAsset | null) | null;
}

export interface ResolveImageIntentsResult {
  course: Course;
  assets: ResolvedAsset[];
  warnings: string[];
}

function findBlock(course: Course, blockId: string): Block | undefined {
  for (const chapter of course.chapters) {
    const block = chapter.blocks.find((candidate) => candidate.id === blockId);
    if (block) return block;
  }
  return undefined;
}

function applyAsset(block: Block, intent: ImageIntent, meta: AssetMeta): void {
  block.content[intent.field] = meta.id;
  if (intent.alt && typeof block.content.alt === 'string') block.content.alt = intent.alt;
}

/**
 * איור SVG ניטרלי בצבעי הערכה — נבנה בזיכרון ונכנס כנכס רגיל, בדיוק כמו
 * איורי התבניות (`src/sample/illustrations.ts`). כך בלוק תמונה שלא נפתר
 * מציג מסגרת מכובדת במקום חור.
 */
export function placeholderIllustration(_intent: ImageIntent, theme: Theme): ResolvedAsset {
  const c = theme.colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450" role="img">
    <rect width="800" height="450" fill="${c.surface}"/>
    <rect x="1" y="1" width="798" height="448" fill="none" stroke="${c.border}" stroke-width="2"/>
    <circle cx="300" cy="190" r="46" fill="${c.primary}" opacity="0.18"/>
    <path d="M232 320 L360 214 L452 292 L556 196 L636 320 Z" fill="${c.primary}" opacity="0.28"/>
    <rect x="300" y="356" width="200" height="12" rx="6" fill="${c.textMuted}" opacity="0.35"/>
  </svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });

  return {
    meta: buildAssetMeta({
      originalName: 'תמונת-מקום.svg',
      mimeType: 'image/svg+xml',
      size: blob.size,
      width: 800,
      height: 450,
    }),
    blob,
  };
}

export async function resolveImageIntents(
  course: Course,
  intents: ImageIntent[],
  options: ResolveImageIntentsOptions = {},
): Promise<ResolveImageIntentsResult> {
  const importFromUrl = options.importFromUrl ?? importAssetFromUrl;
  const fallback = options.fallback === undefined ? placeholderIllustration : options.fallback;

  const next = structuredClone(course);
  const assets: ResolvedAsset[] = [];
  const warnings: string[] = [];

  for (const intent of intents) {
    const block = findBlock(next, intent.blockId);
    if (!block) continue;

    let resolved: ResolvedAsset | null = null;

    const url =
      intent.url ?? (intent.query && options.resolver ? await options.resolver.resolve(intent.query) : null);

    if (url) {
      const result = await importFromUrl(url, intent.alt);
      if (result.ok) resolved = { meta: result.meta, blob: result.blob };
      else warnings.push(`תמונה לא נטענה: ${result.error}`);
    }

    if (!resolved && fallback) resolved = fallback(intent, next.theme);

    if (resolved) {
      applyAsset(block, intent, resolved.meta);
      assets.push(resolved);
    }
  }

  return { course: next, assets, warnings };
}
