import { describe, expect, it } from 'vitest';
import { themePresets } from '@/model/themes';
import {
  contrastRatio,
  isDarkSurface,
  readableTextOn,
  themeToCssVarMap,
  themeToCssVars,
} from './themeToCssVars';

describe('themeToCssVars', () => {
  it('מייצרת משתנה לכל צבע בערכה', () => {
    const vars = themeToCssVarMap(themePresets[0].theme);

    expect(vars['--lc-color-primary']).toBe(themePresets[0].theme.colors.primary);
    expect(vars['--lc-color-background']).toBe(themePresets[0].theme.colors.background);
  });

  it('מייצרת CSS תקין תחת ה-selector שנמסר', () => {
    const css = themeToCssVars(themePresets[0].theme, '.lc-course');

    expect(css.startsWith('.lc-course {')).toBe(true);
    expect(css.trimEnd().endsWith('}')).toBe(true);
    expect(css).toContain('--lc-content-max-width: 780px;');
  });

  it('גוזרת יחידות מספריות עם px', () => {
    const vars = themeToCssVarMap(themePresets[0].theme);

    expect(vars['--lc-font-size-base']).toMatch(/^\d+px$/);
    expect(vars['--lc-radius']).toMatch(/^\d+px$/);
  });
});

describe('ניגודיות', () => {
  it('בוחרת טקסט כהה על רקע בהיר ולהפך', () => {
    expect(readableTextOn('#ffffff')).toBe('#111827');
    expect(readableTextOn('#0b1220')).toBe('#ffffff');
  });

  it('מחזירה לבן כשהצבע אינו תקין, במקום לקרוס', () => {
    expect(readableTextOn('לא-צבע')).toBe('#ffffff');
  });

  it('מחשבת יחס ניגודיות לפי WCAG', () => {
    // שחור על לבן הוא היחס המרבי האפשרי
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it.each(themePresets)(
    'ערכת "$name" עומדת בניגודיות של 4.5:1 לטקסט רגיל',
    ({ theme }) => {
      expect(contrastRatio(theme.colors.text, theme.colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.text, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(themePresets)('ערכת "$name" קריאה גם בטקסט משני (3:1)', ({ theme }) => {
    expect(contrastRatio(theme.colors.textMuted, theme.colors.background)).toBeGreaterThanOrEqual(3);
  });

  it.each(themePresets)('ערכת "$name" מייצרת כפתור ראשי קריא', ({ theme }) => {
    const onPrimary = readableTextOn(theme.colors.primary);
    expect(contrastRatio(onPrimary, theme.colors.primary)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('isDarkSurface', () => {
  it('מזהה רקע כהה לצורך data-scheme', () => {
    expect(isDarkSurface('#0a0f1e')).toBe(true);
    expect(isDarkSurface('#ffffff')).toBe(false);
    expect(isDarkSurface('לא-צבע')).toBe(false);
  });
});
