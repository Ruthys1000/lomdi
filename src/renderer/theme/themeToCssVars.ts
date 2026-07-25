import type { Theme } from '@/model/types';

/**
 * ממירה את אובייקט ה-Theme למשתני CSS.
 *
 * זו הפונקציה היחידה שמתרגמת עיצוב לסגנון, ושני הצדדים משתמשים בה: העורך
 * מזריק את התוצאה ל-<style> מעל הקנבס, והייצוא כותב אותה inline לתוך
 * index.html. מקור אמת אחד — ולכן אין דרך שהעורך והתוצר ייראו שונה.
 */

const FONT_STACKS: Record<Theme['typography']['fontFamily'], string> = {
  // הערה: הגופנים העבריים נטענים רק אם הם מותקנים אצל הלומד. אין טעינה
  // מ-CDN כי התוצר חייב לעבוד ללא אינטרנט (סעיף 17). הטמעת woff2 בתוך
  // ה-ZIP מתוכננת לשלב הליטוש.
  system: `system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
  assistant: `Assistant, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
  heebo: `Heebo, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
  rubik: `Rubik, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
};

const SHADOWS: Record<Theme['shape']['shadow'], string> = {
  none: 'none',
  soft: '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06)',
  medium: '0 2px 4px rgb(15 23 42 / 0.06), 0 16px 40px rgb(15 23 42 / 0.12)',
};

/** יחידת המרווח הבסיסית — כל המרווחים בלומדה נגזרים ממנה */
const DENSITY_UNIT: Record<Theme['layout']['density'], number> = {
  compact: 6,
  comfortable: 8,
  spacious: 11,
};

const LINE_HEIGHT: Record<Theme['layout']['density'], number> = {
  compact: 1.6,
  comfortable: 1.75,
  spacious: 1.85,
};

export function themeToCssVarMap(theme: Theme): Record<string, string> {
  const { colors, typography, shape, layout } = theme;

  return {
    '--lc-color-primary': colors.primary,
    '--lc-color-secondary': colors.secondary,
    '--lc-color-accent': colors.accent,
    '--lc-color-background': colors.background,
    '--lc-color-surface': colors.surface,
    '--lc-color-text': colors.text,
    '--lc-color-text-muted': colors.textMuted,
    '--lc-color-border': colors.border,
    // צבע הטקסט מעל משטח צבעוני נגזר מהבהירות של אותו צבע, כדי שכפתור
    // או כרטיס בצבע הראשי יישארו קריאים בכל ערכה שהמשתמש יבנה
    '--lc-color-on-primary': readableTextOn(colors.primary),
    '--lc-color-on-accent': readableTextOn(colors.accent),

    '--lc-font-family': FONT_STACKS[typography.fontFamily],
    '--lc-font-size-base': `${typography.baseSize}px`,
    '--lc-line-height': String(LINE_HEIGHT[layout.density]),
    '--lc-heading-weight': String(typography.headingWeight),

    '--lc-radius': `${shape.radius}px`,
    '--lc-radius-small': `${Math.round(shape.radius * 0.5)}px`,
    '--lc-shadow': SHADOWS[shape.shadow],

    '--lc-content-max-width': `${layout.contentMaxWidth}px`,
    '--lc-space-unit': `${DENSITY_UNIT[layout.density]}px`,
  };
}

/** מחרוזת CSS מוכנה להזרקה, תחת ה-selector שנמסר */
export function themeToCssVars(theme: Theme, selector = '.lc-course'): string {
  const declarations = Object.entries(themeToCssVarMap(theme))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}

// ─────────────────────────── ניגודיות ───────────────────────────

/**
 * בוחרת טקסט כהה או בהיר מעל צבע נתון לפי בהירות יחסית (WCAG).
 * זה מה שמונע כפתור בצבע בהיר עם טקסט לבן — מצב שקורה בקלות כשמשתמש
 * בוחר צבעים ידנית ב-Theme Builder.
 */
export function readableTextOn(background: string): string {
  const rgb = hexToRgb(background);
  if (!rgb) return '#ffffff';
  return relativeLuminance(rgb) > 0.5 ? '#111827' : '#ffffff';
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value.slice(0, 6);

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** יחס ניגודיות בין שני צבעים, לפי WCAG. 4.5 ומעלה נחשב תקין לטקסט רגיל. */
export function contrastRatio(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return 1;

  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const [light, dark] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];

  return (light + 0.05) / (dark + 0.05);
}
