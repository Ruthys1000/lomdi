import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createBlock } from '@/model/factory';
import { paragraph, richText } from '@/model/richText';
import type { BlockOf } from '@/model/types';
import { RenderContext, type RenderContextValue } from '@/renderer/RenderContext';
import { createAccordionContent, createAccordionItem, type AccordionContent } from './content';
import { AccordionRenderer } from './Renderer';

function renderAccordion(overrides: Partial<AccordionContent> = {}) {
  const content = createAccordionContent({
    items: [
      createAccordionItem({
        id: 'item-1',
        title: 'כמה טקסט זה יותר מדי?',
        doc: richText(paragraph('אם צריך לגלול יותר משני מסכים — פצלו.')),
      }),
      createAccordionItem({
        id: 'item-2',
        title: 'האם חייבים וידאו?',
        doc: richText(paragraph('לא. וידאו עוזר כשצריך להראות תהליך.')),
      }),
    ],
    ...overrides,
  });

  const block = { ...createBlock('accordion'), content } as BlockOf<AccordionContent>;
  const ctx: RenderContextValue = {
    direction: 'rtl',
    resolveAssetUrl: () => undefined,
    isEditing: false,
  };

  return render(
    <RenderContext value={ctx}>
      <AccordionRenderer block={block} />
    </RenderContext>,
  );
}

const trigger = (name: RegExp) => screen.getByRole('button', { name });

describe('AccordionRenderer', () => {
  it('מרנדר את הכותרות ככפתורים אמיתיים ולא כ-div לחיץ (סעיף 18)', () => {
    renderAccordion();

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('כל הפריטים סגורים כברירת מחדל', () => {
    renderAccordion();

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('פותח פריט בלחיצה ומעדכן את aria-expanded', async () => {
    const user = userEvent.setup();
    renderAccordion();

    await user.click(trigger(/כמה טקסט/));

    expect(trigger(/כמה טקסט/)).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/פצלו/)).toBeInTheDocument();
  });

  it('סוגר פריט בלחיצה חוזרת', async () => {
    const user = userEvent.setup();
    renderAccordion();

    await user.click(trigger(/כמה טקסט/));
    await user.click(trigger(/כמה טקסט/));

    expect(trigger(/כמה טקסט/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('במצב single פתיחת פריט סוגרת את האחר', async () => {
    const user = userEvent.setup();
    renderAccordion({ mode: 'single' });

    await user.click(trigger(/כמה טקסט/));
    await user.click(trigger(/האם חייבים/));

    expect(trigger(/כמה טקסט/)).toHaveAttribute('aria-expanded', 'false');
    expect(trigger(/האם חייבים/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('במצב multiple שני פריטים יכולים להיות פתוחים יחד', async () => {
    const user = userEvent.setup();
    renderAccordion({ mode: 'multiple' });

    await user.click(trigger(/כמה טקסט/));
    await user.click(trigger(/האם חייבים/));

    expect(trigger(/כמה טקסט/)).toHaveAttribute('aria-expanded', 'true');
    expect(trigger(/האם חייבים/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('openFirstByDefault פותח את הפריט הראשון בלבד', () => {
    renderAccordion({ openFirstByDefault: true });

    expect(trigger(/כמה טקסט/)).toHaveAttribute('aria-expanded', 'true');
    expect(trigger(/האם חייבים/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('מקשר בין הכותרת לגוף דרך aria-controls ו-aria-labelledby', async () => {
    const user = userEvent.setup();
    renderAccordion();

    await user.click(trigger(/כמה טקסט/));

    const button = trigger(/כמה טקסט/);
    const region = screen.getByRole('region');

    expect(button.getAttribute('aria-controls')).toBe(region.id);
    expect(region.getAttribute('aria-labelledby')).toBe(button.id);
  });

  it('ניתן לפתיחה במקלדת בלבד', async () => {
    const user = userEvent.setup();
    renderAccordion();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(trigger(/כמה טקסט/)).toHaveAttribute('aria-expanded', 'true');
  });

  it('אינו מרנדר דבר בתוצר כשאין פריטים', () => {
    const { container } = renderAccordion({ items: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
