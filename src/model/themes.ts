import type { Theme, ThemePresetId } from './types';

/**
 * שלוש ערכות העיצוב המוכנות (סעיף 10 באפיון).
 *
 * כל הצמדים של טקסט על רקע נבדקו לניגודיות של 4.5:1 לפחות (WCAG AA),
 * כדי שערכה שנבחרה בלחיצה אחת לא תייצר לומדה לא קריאה.
 */

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  theme: Theme;
}

const baseTypography = {
  fontFamily: 'assistant',
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
];

export const defaultTheme: Theme = themePresets[0].theme;

export function getThemePreset(id: ThemePresetId): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}
