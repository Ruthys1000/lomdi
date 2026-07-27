import { describe, expect, it } from 'vitest';
import { blockAssetIds } from '@/blocks/registry.shared';
import { validateProjectFile } from '@/model/validate';
import { buildProjectFile } from '@/persistence/projectFile';
import { courseTemplates } from './index';

/**
 * כל תבנית חייבת לייצר לומדה שעוברת את אותו אימות שקובץ פרויקט מיובא עובר.
 * תבנית עם תוכן בלוק בצורה שגויה הייתה נשברת רק כשמשתמש בוחר בה — הבדיקה
 * הזו תופסת את זה בזמן build.
 */
describe('תבניות הפתיחה', () => {
  it.each(courseTemplates.map((template) => [template.name, template] as const))(
    'התבנית "%s" מייצרת לומדה שעוברת אימות',
    (_name, template) => {
      const { course, assets } = template.create();
      const project = buildProjectFile(
        course,
        assets.map((asset) => asset.meta),
      );

      const result = validateProjectFile(project);
      if (!result.ok) {
        throw new Error(`אימות נכשל: ${result.errors.join(' | ')}`);
      }
      expect(result.ok).toBe(true);
    },
  );

  it.each(courseTemplates.map((template) => [template.name, template] as const))(
    'התבנית "%s" אינה מפנה לנכס שאינו נארז עמה',
    (_name, template) => {
      const { course, assets } = template.create();
      const bundledIds = new Set(assets.map((asset) => asset.meta.id));

      const referenced = course.chapters.flatMap((chapter) =>
        chapter.blocks.flatMap((block) => blockAssetIds(block.type, block.content)),
      );

      for (const id of referenced) {
        expect(bundledIds.has(id)).toBe(true);
      }
    },
  );
});
