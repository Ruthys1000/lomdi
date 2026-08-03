import type { Theme } from '@/model/types';

/**
 * ממירה את אובייקט ה-Theme למשתני CSS.
 *
 * זו הפונקציה היחידה שמתרגמת עיצוב לסגנון, ושני הצדדים משתמשים בה: העורך
 * מזריק את התוצאה ל-<style> מעל הקנבס, והייצוא כותב אותה inline לתוך
 * index.html. מקור אמת אחד — ולכן אין דרך שהעורך והתוצר ייראו שונה.
 */

/**
 * שרשראות הגופנים.
 *
 * שם המשפחה של @fontsource (`Heebo Variable`) ראשון, כי זה הגופן שנארז
 * לתוך ה-ZIP ונטען מ-`fonts/` בנתיב יחסי — בלי CDN, כדי שהתוצר יעבוד
 * גם בלי אינטרנט. השם בלי "Variable" אחריו הוא גיבוי למי שהגופן מותקן
 * אצלו מקומית, ואחריהם גופן המערכת אם קובץ הגופן לא נטען כלל.
 */
const FONT_STACKS: Record<Theme['typography']['fontFamily'], string> = {
  system: `system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
  assistant: `'Assistant Variable', Assistant, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
  heebo: `'Heebo Variable', Heebo, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
  rubik: `'Rubik Variable', Rubik, system-ui, -apple-system, 'Segoe UI', 'Noto Sans Hebrew', Arial, sans-serif`,
};

const SHADOWS_LIGHT: Record<Theme['shape']['shadow'], string> = {
  none: 'none',
  soft: '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(15 23 42 / 0.06)',
  medium: '0 2px 4px rgb(15 23 42 / 0.06), 0 16px 40px rgb(15 23 42 / 0.12)',
};

/** צללים על רקע כהה — הצל ה"בהיר" (slate) כמעט לא נראה על `#0a0f1e` */
const SHADOWS_DARK: Record<Theme['shape']['shadow'], string> = {
  none: 'none',
  soft: '0 1px 2px rgb(0 0 0 / 0.45), 0 8px 28px rgb(0 0 0 / 0.55)',
  medium: '0 2px 6px rgb(0 0 0 / 0.5), 0 16px 48px rgb(0 0 0 / 0.62)',
};

const SHADOW_CARD_LIGHT = '0 4px 12px rgb(15 23 42 / 0.05), 0 16px 36px rgb(15 23 42 / 0.07)';
const SHADOW_CARD_DARK =
  '0 0 0 1px rgb(255 255 255 / 0.06), 0 10px 32px rgb(0 0 0 / 0.55)';
const SHADOW_LG_LIGHT = '0 10px 24px rgb(15 23 42 / 0.1), 0 28px 64px rgb(15 23 42 / 0.14)';
const SHADOW_LG_DARK = '0 12px 28px rgb(0 0 0 / 0.5), 0 32px 72px rgb(0 0 0 / 0.6)';
const SHADOW_HOVER_LIGHT = '0 12px 32px rgb(15 23 42 / 0.1)';
const SHADOW_HOVER_DARK = '0 14px 36px rgb(0 0 0 / 0.55)';

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

const HERO_INK = '#060a14';
const HERO_TEXT = '#ffffff';
/** יחס ניגודיות מינימלי לטקסט לבן על עצירת גרדיאנט ה-hero */
const HERO_MIN_CONTRAST = 4.5;

export function themeToCssVarMap(theme: Theme): Record<string, string> {
  const { colors, typography, shape, layout } = theme;
  const dark = isDarkSurface(colors.background);
  const shadows = dark ? SHADOWS_DARK : SHADOWS_LIGHT;
  const [hero0, hero1, hero2] = heroGradientStops(colors.primary, colors.accent);

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
    // גופן הכותרות נופל לגופן הגוף כשלא נבחר גופן נפרד — כך ההוספה תואמת אחורה
    '--lc-heading-family': FONT_STACKS[typography.headingFamily ?? typography.fontFamily],
    '--lc-font-size-base': `${typography.baseSize}px`,
    '--lc-line-height': String(LINE_HEIGHT[layout.density]),
    '--lc-heading-weight': String(typography.headingWeight),

    '--lc-radius': `${shape.radius}px`,
    '--lc-radius-small': `${Math.round(shape.radius * 0.5)}px`,
    '--lc-shadow': shadows[shape.shadow],
    '--lc-shadow-card': dark ? SHADOW_CARD_DARK : SHADOW_CARD_LIGHT,
    '--lc-shadow-lg': dark ? SHADOW_LG_DARK : SHADOW_LG_LIGHT,
    '--lc-shadow-hover-extra': dark ? SHADOW_HOVER_DARK : SHADOW_HOVER_LIGHT,

    '--lc-gradient-hero': `linear-gradient(135deg, ${hero0} 0%, ${hero1} 58%, ${hero2} 100%)`,

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

const TEXT_DARK = '#111827';
const TEXT_LIGHT = '#ffffff';

/**
 * בוחרת טקסט כהה או בהיר מעל צבע נתון.
 *
 * משווה את יחס הניגודיות של שתי האפשרויות ובוחרת את הגבוהה, ולא חותכת
 * לפי סף בהירות: סף של 0.5 החזיר לבן על ענבר (`#f59e0b`) ועל ורוד
 * (`#ec4899`) — 2.1:1 ו-3.5:1, כלומר כפתור לא קריא בשתי ערכות מוכנות.
 * `themes.test.ts` נועל את זה עכשיו לכל ערכה.
 */
export function readableTextOn(background: string): string {
  if (!hexToRgb(background)) return TEXT_LIGHT;

  return contrastRatio(TEXT_DARK, background) >= contrastRatio(TEXT_LIGHT, background)
    ? TEXT_DARK
    : TEXT_LIGHT;
}

/**
 * האם רקע הלומדה כהה.
 *
 * משמש לבחירת `data-scheme` על שורש הלומדה, ומשם לצבעים הסמנטיים: ירוק כהה
 * על רקע כמעט-שחור נראה כמו כתם, ואדום כהה נעלם. נמדד בלומינציה ולא ב"האם
 * המזהה מכיל dark", כדי שגם ערכה מותאמת שהמשתמש בנה תיפול לצד הנכון.
 */
export function isDarkSurface(background: string): boolean {
  const rgb = hexToRgb(background);
  if (!rgb) return false;

  return relativeLuminance(rgb) < 0.2;
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

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * מערבבת צבע לכיוון דיו ה-hero.
 *
 * `colorPercent` = כמה מהצבע המקורי נשאר (100 = הצבע המלא, 0 = דיו בלבד).
 */
export function mixTowardInk(hex: string, colorPercent: number, ink = HERO_INK): string {
  const color = hexToRgb(hex);
  const inkRgb = hexToRgb(ink);
  if (!color || !inkRgb) return ink;

  const t = Math.min(100, Math.max(0, colorPercent)) / 100;
  return toHex([
    Math.round(color[0] * t + inkRgb[0] * (1 - t)),
    Math.round(color[1] * t + inkRgb[1] * (1 - t)),
    Math.round(color[2] * t + inkRgb[2] * (1 - t)),
  ]);
}

/**
 * מחשיכה צבע עד שטקסט לבן עליו עומד ב-AA.
 *
 * מתחילה מ-`startPercent` של הצבע ומורידה בצעדים — כך primary בהיר
 * (כמו `#7dd3fc` של darkElegant) לא משאיר hero לא קריא.
 */
export function darkenForHeroText(hex: string, startPercent = 42): string {
  let percent = startPercent;
  let mixed = mixTowardInk(hex, percent);
  while (percent > 4 && contrastRatio(HERO_TEXT, mixed) < HERO_MIN_CONTRAST) {
    percent -= 4;
    mixed = mixTowardInk(hex, percent);
  }
  return mixed;
}

/** שלוש עצירות גרדיאנט ה-hero — כולן מובטחות לניגודיות טקסט לבן */
export function heroGradientStops(primary: string, accent: string): [string, string, string] {
  return [
    darkenForHeroText(primary, 44),
    darkenForHeroText(primary, 30),
    darkenForHeroText(accent, 24),
  ];
}
