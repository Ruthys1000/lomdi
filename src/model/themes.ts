import type { Theme, ThemePresetId } from './types';

/**
 * ערכות העיצוב המוכנות (סעיף 10 באפיון).
 *
 * כל הצמדים של טקסט על רקע נבדקו לניגודיות של 4.5:1 לפחות (WCAG AA),
 * כדי שערכה שנבחרה בלחיצה אחת לא תייצר לומדה לא קריאה. `themes.test.ts`
 * אוכף את זה על כל ערכה — הבטחה בהערה אינה נשמרת לבד.
 */

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  theme: Theme;
}

const baseTypography = {
  fontFamily: 'heebo',
  baseSize: 17,
  headingWeight: 700,
  headingStyle: 'plain',
} as const;

export const themePresets: ThemePreset[] = [
  {
    id: 'clean',
    name: 'נקי ובהיר',
    description: 'לבן, אוורירי וקריא. מתאים לנהלים, מדיניות והדרכות ארוכות.',
    theme: {
      preset: 'clean',
      colors: {
        primary: '#2563eb',
        secondary: '#0f172a',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#5b6b7f',
        border: '#e2e8f0',
      },
      typography: { ...baseTypography },
      shape: { radius: 14, shadow: 'soft', buttonStyle: 'solid', cardStyle: 'elevated' },
      layout: { contentMaxWidth: 780, density: 'comfortable' },
    },
  },
  {
    id: 'darkElegant',
    name: 'כהה ואלגנטי',
    description: 'רקע כהה עם הדגשות חמות. מתאים לתוכן קצר ולמצגות תדמית.',
    theme: {
      preset: 'darkElegant',
      colors: {
        primary: '#7dd3fc',
        secondary: '#e2e8f0',
        accent: '#fbbf24',
        background: '#0b1220',
        surface: '#151f31',
        text: '#eef2f7',
        textMuted: '#a3b1c4',
        border: '#26344a',
      },
      typography: { ...baseTypography, headingWeight: 600 },
      shape: { radius: 16, shadow: 'medium', buttonStyle: 'solid', cardStyle: 'bordered' },
      layout: { contentMaxWidth: 760, density: 'comfortable' },
    },
  },
  {
    id: 'vivid',
    name: 'צבעוני ומודרני',
    description: 'צבעים חיים וכותרות בולטות. מתאים להדרכות קצרות ולאונבורדינג.',
    theme: {
      preset: 'vivid',
      colors: {
        primary: '#7c3aed',
        secondary: '#0f766e',
        accent: '#ec4899',
        background: '#ffffff',
        surface: '#f5f3ff',
        text: '#1e1b32',
        textMuted: '#5f5a7a',
        border: '#e5e0f7',
      },
      typography: { ...baseTypography, headingWeight: 800, headingStyle: 'accentBar' },
      shape: { radius: 20, shadow: 'medium', buttonStyle: 'soft', cardStyle: 'elevated' },
      layout: { contentMaxWidth: 820, density: 'spacious' },
    },
  },
  {
    id: 'warmSand',
    name: 'חול חם',
    description: 'גווני חול, חימר וטרקוטה. רקע חמים שנעים לקריאה ארוכה.',
    theme: {
      preset: 'warmSand',
      colors: {
        primary: '#a2543a',
        secondary: '#7c5c3b',
        accent: '#0f766e',
        // שבור-לבן חם ולא לבן: הרקע הוא חצי מהאופי של הערכה הזו
        background: '#fdfaf5',
        surface: '#f5ece0',
        text: '#33261c',
        textMuted: '#6d5949',
        border: '#e6d6c4',
      },
      typography: { ...baseTypography, fontFamily: 'assistant' },
      shape: { radius: 12, shadow: 'soft', buttonStyle: 'solid', cardStyle: 'bordered' },
      layout: { contentMaxWidth: 760, density: 'comfortable' },
    },
  },
  {
    id: 'forest',
    name: 'ירוק יער',
    description: 'ירוק עמוק על רקע קרם, עם הדגשת ענבר. רגוע ורציני.',
    theme: {
      preset: 'forest',
      colors: {
        primary: '#166534',
        secondary: '#14532d',
        accent: '#b45309',
        background: '#fbfdfa',
        surface: '#eef5ee',
        text: '#12241a',
        textMuted: '#4f6355',
        border: '#d3e3d6',
      },
      typography: { ...baseTypography, headingWeight: 700, headingStyle: 'underline' },
      shape: { radius: 10, shadow: 'soft', buttonStyle: 'solid', cardStyle: 'bordered' },
      layout: { contentMaxWidth: 780, density: 'comfortable' },
    },
  },
  {
    id: 'highContrast',
    name: 'ניגודיות גבוהה',
    description: 'שחור-לבן עם הדגשה צהובה, מעל 7:1. לנגישות ולמסכים חלשים.',
    theme: {
      preset: 'highContrast',
      colors: {
        primary: '#000000',
        secondary: '#1a1a1a',
        // צהוב עז מיועד לרקע של הדגשה עם טקסט שחור מעליו — readableTextOn
        // בוחר את הכהה לבד
        accent: '#ffd400',
        background: '#ffffff',
        surface: '#f2f2f2',
        text: '#000000',
        textMuted: '#3d3d3d',
        border: '#000000',
      },
      typography: { ...baseTypography, baseSize: 18, headingWeight: 800 },
      // בלי צללים: קווי מתאר מלאים נראים גם במסך זול ובהדפסה, צל לא
      shape: { radius: 6, shadow: 'none', buttonStyle: 'solid', cardStyle: 'bordered' },
      layout: { contentMaxWidth: 760, density: 'comfortable' },
    },
  },
];

export const defaultTheme: Theme = themePresets[0].theme;

export function getThemePreset(id: ThemePresetId): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}
