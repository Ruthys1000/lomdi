import type { ZodType, ZodTypeDef } from 'zod';
import { getSharedBlockDefinition } from '@/blocks/registry.shared';
import { createAccordionItem, type AccordionItem } from '@/blocks/accordion/content';
import { createCard, type CardItem } from '@/blocks/cards/content';
import type { QuizOption } from '@/blocks/quiz/content';
import { createStep, type StepItem } from '@/blocks/steps/content';
import { courseIconNames } from '@/renderer/icons';
import { createBlockSettings, defaultNavigation } from '@/model/defaults';
import { createChapter, createCourse } from '@/model/factory';
import { createId } from '@/model/ids';
import { getThemePreset, defaultTheme } from '@/model/themes';
import { themeSchema } from '@/model/schema';
import type {
  Block,
  BlockSettings,
  Chapter,
  Course,
  Direction,
  Theme,
  ThemePresetId,
} from '@/model/types';
import { readImageHint, type ImageField } from './imageIntent';
import { sanitizeRichText } from './sanitizeRichText';

/**
 * שכבת הקליטה של תוכן שנוצר ב-AI.
 *
 * `validateProjectFile` בנויה לדחות קובץ פגום ולהגן על העורך — התנהגות
 * נכונה לייבוא קובץ פרויקט, ושגויה לפלט של מודל שפה: שגיאה אחת בבלוק אחד
 * אסור שתפיל לומדה שלמה. לכן במקום *לאמת ולדחות*, המודול הזה *מרפא ומדווח*:
 * ממלא ברירות מחדל, משמיט בלוק לא מוכר עם אזהרה, מנקה טקסט עשיר ומתקן שאלה
 * שבורה — כך שהתוצר תמיד מסמך תקין ורנדרבילי. הוא נשען על אותם יוצרים,
 * סכמות וברירות מחדל של המודל, כדי שלא ייווצר "רף תקינות" שני שיכול לסטות.
 */

export interface CoerceResult {
  course: Course;
  warnings: string[];
}

interface Ctx {
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * שם האייקון חייב להיות מהרשימה הסגורה של `courseIcons` — כל שם אחר מרונדר
 * כלום. המודל בוחר שמות lucide חופשי, ולכן שם לא-מוכר או ריק חוזר לברירת
 * מחדל, כדי שלא ייווצרו כרטיסים "קירחים" בלי אייקון.
 */
const VALID_ICONS = new Set<string>(courseIconNames);
function validIcon(name: unknown, fallback = 'Sparkles'): string {
  return typeof name === 'string' && VALID_ICONS.has(name) ? name : fallback;
}

// ─────────────────────────── תוכן בלוק ───────────────────────────

/**
 * מפעיל את סכמת הבלוק על התוכן שהתקבל, ומצמיד לברירת המחדל כל שדה שנכשל.
 *
 * `createContent()` תמיד מחזיר תוכן תקין, ולכן איפוס שדה פוגע חזרה לערך
 * ממנו מבטיח התכנסות: בכל סבב מאפסים את השדות ש-zod סימן, עד שהמסמך עובר.
 * כך שדות תקינים מה-AI נשמרים, ורק הפגומים חוזרים לברירת מחדל — במקום
 * לזרוק את כל התוכן בגלל שדה אחד.
 */
function coerceAgainstSchema(
  schema: ZodType<unknown, ZodTypeDef, unknown>,
  base: Record<string, unknown>,
  provided: Record<string, unknown>,
): { content: Record<string, unknown>; repaired: boolean } {
  const candidate: Record<string, unknown> = { ...base, ...provided };
  let repaired = false;

  for (let pass = 0; pass < 8; pass += 1) {
    const result = schema.safeParse(candidate);
    if (result.success) return { content: result.data as Record<string, unknown>, repaired };

    let changedThisPass = false;
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && key in base && candidate[key] !== base[key]) {
        candidate[key] = base[key];
        changedThisPass = true;
        repaired = true;
      }
    }
    if (!changedThisPass) break;
  }

  // אם משום מה עדיין לא עובר — ברירת המחדל לבדה תקינה מעצם הגדרתה
  return { content: base, repaired: true };
}

/** מבטיח בשאלת תרגול תשובה נכונה אחת בדיוק — הדרישה של `quizIssues` */
function repairQuiz(content: Record<string, unknown>, ctx: Ctx): void {
  if (!Array.isArray(content.options)) return;

  const options: QuizOption[] = content.options.map((raw) => {
    const record = isRecord(raw) ? raw : {};
    return {
      id: asString(record.id) ?? createId('option'),
      text: asString(record.text) ?? '',
      correct: record.correct === true,
    };
  });

  const correct = options.filter((option) => option.correct);
  if (options.length >= 2 && correct.length === 0) {
    options[0].correct = true;
    ctx.warnings.push('שאלה הגיעה בלי תשובה נכונה — סומנה הראשונה.');
  } else if (correct.length > 1) {
    let kept = false;
    for (const option of options) {
      if (option.correct && kept) option.correct = false;
      else if (option.correct) kept = true;
    }
    ctx.warnings.push('שאלה הגיעה עם כמה תשובות נכונות — נשמרה הראשונה.');
  }

  content.options = options;
}

/**
 * משחזר מערכי `items` בבלוקים cards/accordion.
 *
 * הפריטים האלה נושאים שדות חובה שהמודל מושמט לפי הוראת הפרומפט (`id`, וגם
 * `button`/`imageAssetId` בכרטיס). בלי תיקון, כשל אימות על פריט אחד גורם
 * ל-`coerceAgainstSchema` לאפס את *כל* המערך לברירת מחדל — וכל התוכן שהמודל
 * מילא נעלם. לכן, בדיוק כמו `repairQuiz`, בונים כאן כל פריט מחדש על גבי מפעל
 * הפריט הקיים: השדות החסרים מתמלאים (עם id טרי וייחודי), והתוכן שהמודל נתן
 * נשמר. רק שדות ידועים נשלפים מהפריט הגולמי כדי לא להזריק זבל.
 */
function repairItemArrays(type: string, content: Record<string, unknown>, ctx: Ctx): void {
  if (!Array.isArray(content.items)) return;
  const raw = content.items;

  if (type === 'cards') {
    content.items = raw.map((item): CardItem => {
      const record = isRecord(item) ? item : {};
      // תמיד אייקון תקין — שם לא-מוכר/ריק חוזר לברירת מחדל, כדי שכל הכרטיסים
      // יהיו עקביים (לא חלקם עם אייקון וחלקם בלי)
      const overrides: Partial<CardItem> = { icon: validIcon(record.icon) };
      if (typeof record.title === 'string') overrides.title = record.title;
      if (typeof record.text === 'string') overrides.text = record.text;
      if (typeof record.imageAssetId === 'string') overrides.imageAssetId = record.imageAssetId;
      return createCard(overrides);
    });
  } else if (type === 'accordion') {
    content.items = raw.map((item): AccordionItem => {
      const record = isRecord(item) ? item : {};
      const overrides: Partial<AccordionItem> = {};
      if (typeof record.title === 'string') overrides.title = record.title;
      if (record.doc !== undefined) {
        const { doc, changed } = sanitizeRichText(record.doc);
        overrides.doc = doc;
        if (changed) ctx.warnings.push('חלק מהעיצוב בפריט אקורדיון הושמט.');
      }
      return createAccordionItem(overrides);
    });
  } else if (type === 'steps') {
    content.items = raw.map((item): StepItem => {
      const record = isRecord(item) ? item : {};
      const overrides: Partial<StepItem> = {};
      if (typeof record.title === 'string') overrides.title = record.title;
      if (typeof record.text === 'string') overrides.text = record.text;
      return createStep(overrides);
    });
  }
}

const IMAGE_FIELD_BY_TYPE: Record<string, ImageField> = {
  image: 'assetId',
  textImage: 'imageAssetId',
  hero: 'imageAssetId',
};

/**
 * במקום לפתור תמונה, שומר את הפרומפט שהמודל הציע כ-`imagePrompt` בתוכן.
 *
 * Lomdi לא מייצר תמונות: הבלוק נשאר עם placeholder, והמשתמש מקבל פרומפט
 * מומלץ באנגלית להעתקה למחולל תמונות משלו. הפניית הנכס מתאפסת (אין assetId
 * להמציא), וה-alt של המודל נשמר לנגישות.
 */
function applyImagePrompt(type: string, content: Record<string, unknown>): void {
  const field = IMAGE_FIELD_BY_TYPE[type];
  if (!field) return;

  // ל-hero יש משמעות לתמונה רק כשהרקע הוא תמונה
  if (type === 'hero' && content.backgroundType !== 'image') return;

  const hint = readImageHint(content);
  content[field] = '';
  if (typeof content.alt === 'string' && hint?.alt) content.alt = hint.alt;

  // fallback: אם המודל השמיט query, משתמשים ב-alt/caption כדי שהבלוק לא יישאר
  // בלי הצעת פרומפט כלל.
  const caption = typeof content.caption === 'string' ? content.caption.trim() : '';
  const prompt = hint?.query ?? hint?.alt ?? (caption || undefined);
  if (prompt) content.imagePrompt = prompt;
}

function coerceBlock(raw: unknown, ctx: Ctx): Block | null {
  if (!isRecord(raw)) {
    ctx.warnings.push('בלוק לא תקין הושמט.');
    return null;
  }

  const type = asString(raw.type);
  if (!type) {
    ctx.warnings.push('בלוק בלי סוג הושמט.');
    return null;
  }

  const definition = getSharedBlockDefinition(type);
  if (!definition) {
    ctx.warnings.push(`בלוק מסוג לא מוכר "${type}" הושמט.`);
    return null;
  }

  const id = createId('block');
  const base = definition.createContent() as Record<string, unknown>;
  const provided = isRecord(raw.content) ? { ...raw.content } : {};

  // ניקוי טקסט עשיר לפני האימות — אחרת node לא מוכר אחד יפיל את הבלוק
  for (const key of ['doc'] as const) {
    if (key in provided) {
      const { doc, changed } = sanitizeRichText(provided[key]);
      provided[key] = doc;
      if (changed) ctx.warnings.push(`חלק מהעיצוב בטקסט בבלוק "${definition.label}" הושמט.`);
    }
  }

  if (type === 'quiz') repairQuiz(provided, ctx);
  // callout מחזיק אייקון בודד (לא במערך items) — מנרמלים אותו כאן לשם תקין
  if (type === 'callout') provided.icon = validIcon(provided.icon, 'Lightbulb');
  repairItemArrays(type, provided, ctx);
  applyImagePrompt(type, provided);

  const { content, repaired } = coerceAgainstSchema(definition.schema, base, provided);
  if (repaired) ctx.warnings.push(`תוכן בבלוק "${definition.label}" תוקן חלקית לברירת מחדל.`);

  const settings = createBlockSettings({
    ...definition.defaultSettings,
    ...coerceSettings(raw.settings),
  });

  return { id, type, content, settings };
}

// ─────────────────────────── הגדרות בלוק ───────────────────────────

const WIDTHS = ['narrow', 'normal', 'wide', 'full'];
const ALIGNMENTS = ['start', 'center', 'end'];
const BACKGROUNDS = ['transparent', 'surface', 'primary', 'accent', 'muted', 'gradient', 'gradientSoft'];
const SPACINGS = ['none', 'small', 'medium', 'large'];

function pickEnum<T extends string>(value: unknown, allowed: readonly string[]): T | undefined {
  return typeof value === 'string' && allowed.includes(value) ? (value as T) : undefined;
}

function coerceSettings(raw: unknown): Partial<BlockSettings> {
  if (!isRecord(raw)) return {};
  const settings: Partial<BlockSettings> = {};
  const width = pickEnum<BlockSettings['width']>(raw.width, WIDTHS);
  const alignment = pickEnum<BlockSettings['alignment']>(raw.alignment, ALIGNMENTS);
  const background = pickEnum<BlockSettings['background']>(raw.background, BACKGROUNDS);
  const spacingTop = pickEnum<BlockSettings['spacingTop']>(raw.spacingTop, SPACINGS);
  const spacingBottom = pickEnum<BlockSettings['spacingBottom']>(raw.spacingBottom, SPACINGS);
  if (width) settings.width = width;
  if (alignment) settings.alignment = alignment;
  if (background) settings.background = background;
  if (spacingTop) settings.spacingTop = spacingTop;
  if (spacingBottom) settings.spacingBottom = spacingBottom;
  return settings;
}

// ─────────────────────────── פרק וקורס ───────────────────────────

function coerceChapter(raw: unknown, ctx: Ctx): Chapter {
  const record = isRecord(raw) ? raw : {};
  const blocksRaw = Array.isArray(record.blocks) ? record.blocks : [];
  const blocks = blocksRaw
    .map((block) => coerceBlock(block, ctx))
    .filter((block): block is Block => block !== null);

  return createChapter({
    title: asString(record.title) ?? 'פרק',
    description: asString(record.description) ?? '',
    blocks,
  });
}

const THEME_PRESET_IDS = [
  'clean',
  'darkElegant',
  'vivid',
  'warmSand',
  'forest',
  'highContrast',
  'sunset',
  'midnight',
];

function coerceTheme(raw: unknown): Theme {
  if (typeof raw === 'string' && THEME_PRESET_IDS.includes(raw)) {
    return getThemePreset(raw as ThemePresetId)!.theme;
  }
  if (isRecord(raw)) {
    // ערכה מותאמת מלאה — אם היא עוברת את הסכמה, מכבדים אותה
    const custom = themeSchema.safeParse(raw);
    if (custom.success) return custom.data as Theme;
    // אחרת, אם יש שם ערכה מוכר, נשתמש בו
    if (typeof raw.preset === 'string' && THEME_PRESET_IDS.includes(raw.preset)) {
      return getThemePreset(raw.preset as ThemePresetId)!.theme;
    }
  }
  return defaultTheme;
}

/**
 * הופך פלט JSON חופשי מ-AI ללומדה תקינה, ואוסף אזהרות וכוונות תמונה.
 * לא זורק אף פעם: קלט חסר-תקווה מחזיר לומדה עם פרק ריק אחד.
 */
export function coerceGeneratedCourse(raw: unknown, format?: string): CoerceResult {
  const ctx: Ctx = { warnings: [] };
  const root = isRecord(raw) ? raw : {};

  if (!isRecord(raw)) ctx.warnings.push('הפלט לא היה אובייקט לומדה תקין.');

  const chaptersRaw = Array.isArray(root.chapters)
    ? root.chapters
    : Array.isArray(root.blocks)
      ? [{ blocks: root.blocks }]
      : [];

  const chapters = chaptersRaw.map((chapter) => coerceChapter(chapter, ctx));
  if (chapters.length === 0) {
    chapters.push(createChapter({ title: 'פרק ראשון' }));
    ctx.warnings.push('לא נמצאו פרקים בפלט — נוצר פרק ריק.');
  }

  const direction: Direction = root.direction === 'ltr' ? 'ltr' : 'rtl';
  const language = typeof root.language === 'string' && root.language.length >= 2 ? root.language : 'he';
  const mode = root.navigation && isRecord(root.navigation) ? root.navigation.mode : undefined;

  const course = createCourse({
    title: asString(root.title) ?? 'לומדה חדשה',
    subtitle: asString(root.subtitle) ?? '',
    description: asString(root.description) ?? '',
    // הפורמט נבחר בצד הלקוח (לא ע"י המודל) ומוזרק כאן, כדי שהעורך יחיל את
    // אילוצי הפורמט על לומדה שנוצרה ב-AI
    ...(format ? { format } : {}),
    direction,
    language,
    theme: coerceTheme(root.theme),
    navigation: { ...defaultNavigation, mode: mode === 'scroll' ? 'scroll' : defaultNavigation.mode },
    chapters,
  });

  return { course, warnings: ctx.warnings };
}
