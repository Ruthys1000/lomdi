import type { Theme, ThemePresetId } from './types';

/**
 * ערכות העיצוב המוכנות (סעיף 10 באפיון).
 *
 * כל הצמדים של טקסט על רקע נבדקו לניגודיות של 4.5:1 לפחות (WCAG AA),
 * כדי שערכה שנבחרה בלחיצה אחת לא תייצר לומדה לא קריאה. `themes.test.ts`
 * אוכף את זה על כל ערכה — הבטחה בהערה אינה נשמרת לבד.
 *
 * כל ערכה אמורה להרגיש כמו מערכת עיצוב קטנה (פלטה + טיפוגרפיה + צורה),
 * לא רק החלפת primary. זיווג גופן כותרת/גוף, סגנון כפתור/כרטיס וצפיפות
 * הם חלק מהזהות.
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
    description: 'רקע כהה שקט עם תכלת חם. מצגות תדמית ותוכן קצר — לא ניאון.',
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
      typography: {
        ...baseTypography,
        fontFamily: 'heebo',
        headingFamily: 'rubik',
        headingWeight: 600,
        headingStyle: 'plain',
      },
      shape: { radius: 16, shadow: 'soft', buttonStyle: 'outline', cardStyle: 'bordered' },
      layout: { contentMaxWidth: 760, density: 'comfortable' },
    },
  },
  {
    id: 'vivid',
    name: 'צבעוני ומודרני',
    description: 'טורקיז וורוד-אלמוג על לבן. אנרגטי לאונבורדינג ולהדרכות קצרות — בלי סגול SaaS.',
    theme: {
      preset: 'vivid',
      colors: {
        primary: '#0d9488',
        secondary: '#134e4a',
        accent: '#f43f5e',
        background: '#ffffff',
        surface: '#f0fdfa',
        text: '#042f2e',
        textMuted: '#3f6864',
        border: '#cce7e2',
      },
      typography: {
        ...baseTypography,
        fontFamily: 'rubik',
        headingWeight: 800,
        headingStyle: 'accentBar',
      },
      shape: { radius: 20, shadow: 'medium', buttonStyle: 'soft', cardStyle: 'elevated' },
      layout: { contentMaxWidth: 820, density: 'spacious' },
    },
  },
  {
    id: 'warmSand',
    name: 'חול חם',
    description: 'גווני חול וחימר עם טיל כהה. רקע חמים לקריאה ארוכה וסיפורית.',
    theme: {
      preset: 'warmSand',
      colors: {
        primary: '#9a3412',
        secondary: '#7c5c3b',
        accent: '#0f766e',
        // שבור-לבן חם ולא לבן: הרקע הוא חצי מהאופי של הערכה הזו
        background: '#faf6f0',
        surface: '#f3ebe0',
        text: '#2c2118',
        textMuted: '#6d5949',
        border: '#e2d3c2',
      },
      typography: {
        ...baseTypography,
        fontFamily: 'assistant',
        headingFamily: 'heebo',
        headingWeight: 700,
        headingStyle: 'underline',
      },
      shape: { radius: 12, shadow: 'soft', buttonStyle: 'solid', cardStyle: 'bordered' },
      layout: { contentMaxWidth: 720, density: 'comfortable' },
    },
  },
  {
    id: 'forest',
    name: 'ירוק יער',
    description: 'ירוק עמוק על רקע קרם, עם הדגשת ענבר. רגוע ורציני — לנהלים ומדיניות.',
    theme: {
      preset: 'forest',
      colors: {
        primary: '#166534',
        secondary: '#3f6212',
        accent: '#b45309',
        background: '#fbfdfa',
        surface: '#eef5ee',
        text: '#12241a',
        textMuted: '#4f6355',
        border: '#d3e3d6',
      },
      typography: {
        ...baseTypography,
        fontFamily: 'heebo',
        headingFamily: 'assistant',
        headingWeight: 700,
        headingStyle: 'underline',
      },
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
      // בלי צללים: קווי מתאר מלאים נראים גם במסך זול ובהדפסה; כפתור outline מדגיש מסגרת
      shape: { radius: 6, shadow: 'none', buttonStyle: 'outline', cardStyle: 'flat' },
      layout: { contentMaxWidth: 760, density: 'compact' },
    },
  },
  {
    id: 'sunset',
    name: 'שקיעה',
    description: 'ורוד עז וענבר על רקע חם. נועז וחגיגי — לאונבורדינג, השקות וקמפיינים.',
    theme: {
      preset: 'sunset',
      colors: {
        primary: '#be185d',
        secondary: '#7c2d12',
        accent: '#f59e0b',
        background: '#fff7f9',
        surface: '#fdeef4',
        text: '#3b0a22',
        textMuted: '#7a2f52',
        border: '#f6cddd',
      },
      typography: {
        ...baseTypography,
        fontFamily: 'rubik',
        headingWeight: 800,
        headingStyle: 'accentBar',
      },
      shape: { radius: 22, shadow: 'medium', buttonStyle: 'solid', cardStyle: 'elevated' },
      layout: { contentMaxWidth: 820, density: 'spacious' },
    },
  },
  {
    id: 'midnight',
    name: 'חצות',
    description: 'נייבי עמוק עם אינדיגו וציאן זוהר. דרמטי ומודרני — למצגות ולתוכן קצר.',
    theme: {
      preset: 'midnight',
      colors: {
        primary: '#4f46e5',
        secondary: '#c7d2fe',
        accent: '#22d3ee',
        background: '#0a0f1e',
        surface: '#131a30',
        text: '#f5f7ff',
        textMuted: '#9fb0d0',
        border: '#263154',
      },
      typography: {
        ...baseTypography,
        fontFamily: 'rubik',
        headingWeight: 800,
        headingStyle: 'accentBar',
      },
      shape: { radius: 18, shadow: 'medium', buttonStyle: 'soft', cardStyle: 'elevated' },
      layout: { contentMaxWidth: 800, density: 'spacious' },
    },
  },
];

export const defaultTheme: Theme = themePresets[0].theme;

export function getThemePreset(id: ThemePresetId): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}
