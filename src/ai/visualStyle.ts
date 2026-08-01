import type { Theme } from '@/model/types';

/**
 * "סגנון חזותי" — ה-art direction של הלומדה.
 *
 * זה הלב של המדיה שנוצרת ב-AI: לא "החלפת ספק", אלא סט איורים *קוהרנטי*
 * ללומדה אחת. במקום שכל תמונה תיוצר בפני עצמה (וכל אחת תיראה אחרת),
 * ה-brief הזה נמרח על *כל* התמונות — אותו סגנון איור, אותה פלטה, אותו
 * מוטיב — כך שהסט כולו נראה מעוצב יחד. זה מה שהופך "תבנית" ל"עיצוב".
 *
 * ה-brief מגיע מ-Claude (שמכוון את הסגנון לפי הנושא), ואם המודל השמיט אותו —
 * נגזר דטרמיניסטית מהערכה של הלומדה, כדי שהצבעים תמיד יתאימו ל-theme.
 * המודול טהור בכוונה (אין fetch, אין תלות בספק) כדי ש-`buildImagePrompt`
 * יהיה נבדק ביחידה, ושבניית ה-prompt תישאר בצד הלקוח — ה-endpoint רק מרנדר.
 */

export interface VisualStyle {
  /** תיאור סגנון האיור — נמרח על כל תמונה (למשל "flat vector illustration…") */
  artStyle: string;
  /** פלטת צבעים (hex) — בדרך כלל צבעי ה-theme, לעקביות מול העיצוב */
  palette: string[];
  /** מוטיב חוזר אופציונלי שמלכד את הסט (למשל "recurring paper-plane motif") */
  motif?: string;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * סגנון ברירת מחדל — נגזר מהערכה של הלומדה.
 *
 * הפלטה נלקחת ישירות מצבעי ה-theme כך שהאיורים תמיד מתלכדים עם שאר העיצוב,
 * גם כשהמודל לא סיפק brief. הסגנון עצמו נבחר להיות ידידותי, נקי ו"הדרכתי" —
 * מתאים ללומדות ארגוניות — ובלי טקסט (טקסט מיוצר תמיד נראה שבור).
 */
export function defaultVisualStyle(theme: Theme): VisualStyle {
  const c = theme.colors;
  return {
    artStyle:
      'clean modern flat vector illustration, soft rounded shapes, generous negative space, ' +
      'subtle depth, friendly and professional editorial style, consistent line weight, no text, no words',
    palette: [c.primary, c.secondary, c.accent, c.background].filter((color): color is string =>
      typeof color === 'string' && HEX.test(color),
    ),
  };
}

/**
 * מרפא brief שהגיע מ-AI לכדי `VisualStyle` תקין. סלחני בדיוק כמו שאר שכבת
 * הקליטה: שדה חסר או פגום נופל לברירת המחדל הנגזרת מהערכה, לעולם לא זורק.
 */
export function coerceVisualStyle(raw: unknown, theme: Theme): VisualStyle {
  const fallback = defaultVisualStyle(theme);
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return fallback;

  const record = raw as Record<string, unknown>;

  const artStyle =
    typeof record.artStyle === 'string' && record.artStyle.trim()
      ? record.artStyle.trim()
      : fallback.artStyle;

  const palette = Array.isArray(record.palette)
    ? record.palette.filter((color): color is string => typeof color === 'string' && HEX.test(color))
    : [];

  const motif = typeof record.motif === 'string' && record.motif.trim() ? record.motif.trim() : undefined;

  return {
    artStyle,
    palette: palette.length ? palette : fallback.palette,
    ...(motif ? { motif } : {}),
  };
}

/**
 * בונה את ה-prompt הסופי לתמונה בודדת: הסצנה הספציפית (query) מובילה, ואחריה
 * אילוצי הסגנון המשותפים לכל הסט. הפרדת הסצנה מהסגנון היא מה שנותן קוהרנטיות —
 * ה-query משתנה מתמונה לתמונה, אבל ה-artStyle/palette/motif זהים בכולן.
 */
export function buildImagePrompt(style: VisualStyle, query: string): string {
  const parts = [query.trim(), `Art style: ${style.artStyle}.`];
  if (style.palette.length) parts.push(`Color palette: ${style.palette.join(', ')}.`);
  if (style.motif) parts.push(`Recurring motif: ${style.motif}.`);
  return parts.join(' ');
}
