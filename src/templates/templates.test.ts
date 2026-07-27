import { describe, expect, it } from 'vitest';
import { blockAssetIds } from '@/blocks/registry.shared';
import { validateProjectFile } from '@/model/validate';
import { buildProjectFile } from '@/persistence/projectFile';
import { getCourseIcon } from '@/renderer/icons';
import { courseTemplates, getTemplate } from './index';

/** אוסף כל שמות האייקונים (שדות icon לא-ריקים) בעומק אובייקט התוכן */
function collectIconNames(value: unknown, acc: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectIconNames(item, acc);
  } else if (value && typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      if (key === 'icon' && typeof val === 'string' && val) acc.push(val);
      else collectIconNames(val, acc);
    }
  }
  return acc;
}

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

  it.each(courseTemplates.map((template) => [template.name, template] as const))(
    'התבנית "%s" משתמשת רק באייקונים שקיימים בקטלוג',
    (_name, template) => {
      const { course } = template.create();
      const icons = course.chapters.flatMap((chapter) =>
        chapter.blocks.flatMap((block) => collectIconNames(block.content)),
      );

      for (const icon of icons) {
        // אייקון שאינו בקטלוג לא מרונדר בשקט — בדיוק סוג התקלה שהבדיקה מונעת
        expect(getCourseIcon(icon), `אייקון חסר בקטלוג: ${icon}`).toBeDefined();
      }
    },
  );

  it('"הדרכה קצרה" מגיעה עם תוכן ועם האיור שלה, ולא עם בלוקים ריקים', () => {
    const { course, assets } = getTemplate('shortTraining')!.create();

    // האיור נארז עם התבנית
    expect(assets.length).toBeGreaterThan(0);

    // הכרטיסים אינם ברירת המחדל הריקה: אין כרטיס שנשאר "כותרת הכרטיס"
    const cards = course.chapters
      .flatMap((chapter) => chapter.blocks)
      .filter((block) => block.type === 'cards');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      for (const item of (card.content as { items: { title: string }[] }).items) {
        expect(item.title).not.toBe('כותרת הכרטיס');
      }
    }
  });
});
