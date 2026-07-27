import { describe, expect, it } from 'vitest';
import { heroContentSchema, createHeroContent } from './hero/content';
import { cardsContentSchema, createCardsContent } from './cards/content';
import { textImageContentSchema, createTextImageContent } from './textImage/content';
import { statsContentSchema, createStatsContent } from './stats/content';
import { quoteContentSchema, createQuoteContent } from './quote/content';

/**
 * שדה `variant` נוסף לבלוקים דרך `.default()` בכוונה: קובץ פרויקט ישן
 * שנשמר לפני שהשדה היה קיים אינו מכיל אותו, וחייב להיטען כברירת המחדל
 * במקום להיכשל באימות. הבדיקה נועלת את ההתנהגות הזו — היא מה שמאפשר
 * להוסיף וריאציות בלי מיגרציה.
 */
describe('תאימות אחורה של שדה variant', () => {
  it.each([
    ['hero', heroContentSchema, createHeroContent(), 'centered'],
    ['cards', cardsContentSchema, createCardsContent(), 'plain'],
    ['textImage', textImageContentSchema, createTextImageContent(), 'standard'],
    ['stats', statsContentSchema, createStatsContent(), 'plain'],
    ['quote', quoteContentSchema, createQuoteContent(), 'emphasis'],
  ])('%s — תוכן בלי variant נטען כברירת המחדל', (_name, schema, content, expected) => {
    const legacy = { ...(content as Record<string, unknown>) };
    delete legacy.variant;

    const parsed = schema.parse(legacy) as { variant: string };
    expect(parsed.variant).toBe(expected);
  });

  it.each([
    ['stats', createStatsContent()],
    ['quote', createQuoteContent()],
  ])('%s — ברירת המחדל תקפה מול הסכמה', (_name, content) => {
    const schema = _name === 'stats' ? statsContentSchema : quoteContentSchema;
    expect(schema.safeParse(content).success).toBe(true);
  });
});
