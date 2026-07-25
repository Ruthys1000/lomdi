import { describe, expect, it } from 'vitest';
import { contrastRatio, readableTextOn } from '@/renderer/theme/themeToCssVars';
import { themeSchema } from './schema';
import { defaultTheme, getThemePreset, themePresets } from './themes';

/**
 * ההערה בראש `themes.ts` מבטיחה שכל ערכה מוכנה עומדת ב-WCAG AA. עד היום
 * זו הייתה הבטחה בהערה בלבד, ולכן ערכה חדשה יכלה להיכנס עם טקסט אפור על
 * רקע קרם ואיש לא היה יודע עד שלומדה יצאה לאוויר.
 *
 * הבדיקה רצה על **כל** ערכה ברשימה, ולכן היא חלה גם על ערכות עתידיות בלי
 * לגעת בה.
 */

describe('ערכות העיצוב המוכנות', () => {
  it.each(themePresets)('$name — טקסט על רקע עומד ב-AA', ({ theme }) => {
    expect(contrastRatio(theme.colors.text, theme.colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themePresets)('$name — טקסט משני קריא גם על הרקע וגם על משטח', ({ theme }) => {
    expect(contrastRatio(theme.colors.textMuted, theme.colors.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(theme.colors.textMuted, theme.colors.surface)).toBeGreaterThanOrEqual(3);
  });

  it.each(themePresets)('$name — טקסט על הצבע הראשי ועל ההדגשה קריא', ({ theme }) => {
    expect(
      contrastRatio(readableTextOn(theme.colors.primary), theme.colors.primary),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(readableTextOn(theme.colors.accent), theme.colors.accent),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themePresets)('$name — עוברת את סכמת האימות של קובץ הפרויקט', ({ theme }) => {
    expect(themeSchema.safeParse(theme).success).toBe(true);
  });

  it('לכל ערכה מזהה ייחודי שתואם את השדה preset שבתוכה', () => {
    const ids = themePresets.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of themePresets) expect(preset.theme.preset).toBe(preset.id);
  });

  it('getThemePreset מחזירה את הערכה לפי מזהה', () => {
    expect(getThemePreset('highContrast')?.name).toBe('ניגודיות גבוהה');
  });

  it('ניגודיות גבוהה חורגת מעל 7:1 — זו כל הסיבה שהיא קיימת', () => {
    const theme = getThemePreset('highContrast')!.theme;

    expect(contrastRatio(theme.colors.text, theme.colors.background)).toBeGreaterThan(7);
  });

  it('ברירת המחדל היא הערכה הראשונה, בגופן שנארז לתוצר', () => {
    expect(defaultTheme).toBe(themePresets[0].theme);
    expect(defaultTheme.typography.fontFamily).toBe('heebo');
  });
});
