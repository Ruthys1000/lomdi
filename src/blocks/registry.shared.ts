import type { ZodType, ZodTypeDef } from 'zod';
import type { BlockSettings } from '@/model/types';
import { blockLabels } from './labels';
import { heroContentSchema, createHeroContent, heroAssetIds } from './hero/content';
import { richTextContentSchema, createRichTextContent, richTextAssetIds } from './richText/content';
import { imageContentSchema, createImageContent, imageAssetIds } from './image/content';
import { textImageContentSchema, createTextImageContent, textImageAssetIds } from './textImage/content';
import { cardsContentSchema, createCardsContent, cardsAssetIds } from './cards/content';
import { accordionContentSchema, createAccordionContent, accordionAssetIds } from './accordion/content';
import { videoContentSchema, createVideoContent, videoAssetIds } from './video/content';
import { quizContentSchema, createQuizContent, quizAssetIds } from './quiz/content';
import { dividerContentSchema, createDividerContent, dividerAssetIds } from './divider/content';
import { quoteContentSchema, createQuoteContent, quoteAssetIds } from './quote/content';
import { calloutContentSchema, createCalloutContent, calloutAssetIds } from './callout/content';
import { stepsContentSchema, createStepsContent, stepsAssetIds } from './steps/content';

/**
 * הרגיסטרי המשותף — הצד של הבלוקים שאין בו React.
 *
 * זהו מקור האמת לשאלות "מה התוכן ההתחלתי של בלוק מסוג X", "האם התוכן
 * שלו תקין" ו"אילו נכסים הוא משתמש בהם". הוא נצרך גם על ידי שכבת המודל,
 * גם על ידי הייצוא וגם על ידי העורך — ולכן הוא נשאר נקי מרכיבי React.
 *
 * הרגיסטרי הזה מחולק משני האחרים בכוונה:
 *   registry.shared  — סכמות, ברירות מחדל, נכסים (כאן)
 *   registry.runtime — רכיבי Renderer בלבד, נארזים לתוצר
 *   registry.editor  — Editor/Settings/אייקונים, לעורך בלבד
 */

export type BlockCategory = 'content' | 'media' | 'interaction' | 'structure';

export interface SharedBlockDefinition<C = unknown> {
  type: string;
  label: string;
  description: string;
  category: BlockCategory;
  /**
   * הקלט הוא unknown ולא C: בלוק שמשתמש ב-`.default()` (כמו שדה variant)
   * מקבל קלט אופציונלי אך פולט C מלא, ולכן טיפוס הקלט חייב להיות רחב יותר.
   */
  schema: ZodType<C, ZodTypeDef, unknown>;
  createContent: () => C;
  usedAssetIds: (content: C) => string[];
  /**
   * חריגות מהגדרות הפריסה הרגילות.
   * הירו נולד ברוחב מלא וללא מרווחים, אחרת רקע מלא-מסך נראה כקופסה
   * צפה באמצע העמוד; מפריד נולד בלי מרווחים כי הוא עצמו המרווח.
   */
  defaultSettings?: Partial<BlockSettings>;
}

function define<C>(definition: SharedBlockDefinition<C>): SharedBlockDefinition<unknown> {
  return definition as unknown as SharedBlockDefinition<unknown>;
}

export const sharedBlockRegistry: Record<string, SharedBlockDefinition<unknown>> = {
  hero: define({
    type: 'hero',
    label: blockLabels.hero,
    description: 'מסך פתיחה עם כותרת, כותרת משנה ורקע.',
    category: 'structure',
    schema: heroContentSchema,
    createContent: createHeroContent,
    usedAssetIds: heroAssetIds,
    defaultSettings: { width: 'full', spacingTop: 'none', spacingBottom: 'none' },
  }),
  richText: define({
    type: 'richText',
    label: blockLabels.richText,
    description: 'פסקאות, כותרות, רשימות וציטוטים.',
    category: 'content',
    schema: richTextContentSchema,
    createContent: createRichTextContent,
    usedAssetIds: richTextAssetIds,
  }),
  image: define({
    type: 'image',
    label: blockLabels.image,
    description: 'תמונה עם כיתוב וטקסט חלופי.',
    category: 'media',
    schema: imageContentSchema,
    createContent: createImageContent,
    usedAssetIds: imageAssetIds,
  }),
  textImage: define({
    type: 'textImage',
    label: blockLabels.textImage,
    description: 'טקסט לצד תמונה, בפריסה שמתקפלת במובייל.',
    category: 'content',
    schema: textImageContentSchema,
    createContent: createTextImageContent,
    usedAssetIds: textImageAssetIds,
  }),
  cards: define({
    type: 'cards',
    label: blockLabels.cards,
    description: 'שניים עד ארבעה כרטיסים עם אייקון, כותרת וטקסט.',
    category: 'content',
    schema: cardsContentSchema,
    createContent: createCardsContent,
    usedAssetIds: cardsAssetIds,
  }),
  accordion: define({
    type: 'accordion',
    label: blockLabels.accordion,
    description: 'פריטים נפתחים — מתאים לשאלות ותשובות.',
    category: 'interaction',
    schema: accordionContentSchema,
    createContent: createAccordionContent,
    usedAssetIds: accordionAssetIds,
  }),
  video: define({
    type: 'video',
    label: blockLabels.video,
    description: 'סרטון מיוטיוב, מ-Vimeo או קובץ שהועלה.',
    category: 'media',
    schema: videoContentSchema,
    createContent: createVideoContent,
    usedAssetIds: videoAssetIds,
  }),
  quiz: define({
    type: 'quiz',
    label: blockLabels.quiz,
    description: 'שאלת תרגול עם משוב מיידי.',
    category: 'interaction',
    schema: quizContentSchema,
    createContent: createQuizContent,
    usedAssetIds: quizAssetIds,
  }),
  divider: define({
    type: 'divider',
    label: blockLabels.divider,
    description: 'רווח, קו או אייקון בין חלקי התוכן.',
    category: 'structure',
    schema: dividerContentSchema,
    createContent: createDividerContent,
    usedAssetIds: dividerAssetIds,
    defaultSettings: { spacingTop: 'none', spacingBottom: 'none' },
  }),
  quote: define({
    type: 'quote',
    label: blockLabels.quote,
    description: 'ציטוט או המלצה בולטים, עם ייחוס.',
    category: 'content',
    schema: quoteContentSchema,
    createContent: createQuoteContent,
    usedAssetIds: quoteAssetIds,
  }),
  callout: define({
    type: 'callout',
    label: blockLabels.callout,
    description: 'קופסה בולטת למסר מרכזי, טיפ או אזהרה.',
    category: 'content',
    schema: calloutContentSchema,
    createContent: createCalloutContent,
    usedAssetIds: calloutAssetIds,
  }),
  steps: define({
    type: 'steps',
    label: blockLabels.steps,
    description: 'רצף שלבים ממוספר — לנהלים ותהליכים.',
    category: 'content',
    schema: stepsContentSchema,
    createContent: createStepsContent,
    usedAssetIds: stepsAssetIds,
  }),
};

export { blockLabel } from './labels';

export const blockTypes = Object.keys(sharedBlockRegistry);

export function getSharedBlockDefinition(type: string): SharedBlockDefinition<unknown> | undefined {
  return sharedBlockRegistry[type];
}

/** כל הנכסים שבלוק מסוים משתמש בהם — הבסיס לאיסוף הנכסים בייצוא */
export function blockAssetIds(type: string, content: unknown): string[] {
  const definition = sharedBlockRegistry[type];
  if (!definition) return [];
  try {
    return definition.usedAssetIds(content);
  } catch {
    return [];
  }
}
