import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  darkenForHeroText,
  heroGradientStops,
  readableTextOn,
} from '@/renderer/theme/themeToCssVars';
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

  it.each(themePresets)('$name — טקסט לבן על עצירות גרדיאנט ה-hero קריא', ({ theme }) => {
    const [stop0, stop1, stop2] = heroGradientStops(theme.colors.primary, theme.colors.accent);
    for (const stop of [stop0, stop1, stop2]) {
      expect(contrastRatio('#ffffff', stop)).toBeGreaterThanOrEqual(4.5);
    }
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

  it('כהה ואלגנטי מחשיך primary בהיר ל-hero קריא', () => {
    const primary = getThemePreset('darkElegant')!.theme.colors.primary;
    // בלי ההחשכה: ערבוב רדוד היה משאיר ~2:1 בין לבן ל-primary הבהיר
    expect(contrastRatio('#ffffff', primary)).toBeLessThan(4.5);
    expect(contrastRatio('#ffffff', darkenForHeroText(primary))).toBeGreaterThanOrEqual(4.5);
  });

  it('ערכות כהות נבדלות זו מזו בצורת כפתור/כרטיס', () => {
    const elegant = getThemePreset('darkElegant')!.theme;
    const midnight = getThemePreset('midnight')!.theme;

    expect(elegant.shape.buttonStyle).not.toBe(midnight.shape.buttonStyle);
    expect(elegant.shape.cardStyle).not.toBe(midnight.shape.cardStyle);
  });
});
