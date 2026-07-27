import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createBlock } from '@/model/factory';
import type { BlockOf } from '@/model/types';
import { createCardsContent, type CardsContent } from './content';
import { CardsEditor } from './Editor';

/**
 * שומר מפני סחף: מחלקת הווריאציה חייבת להופיע גם ב-Editor (הקנבס מציג אותו
 * במקום ה-Renderer בזמן עריכה). בלי זה שינוי וריאציה נראה רק בתצוגה המקדימה.
 */
function renderEditor(variant: CardsContent['variant']) {
  const block = createBlock('cards', {
    content: createCardsContent({ variant }),
  }) as BlockOf<CardsContent>;
  return render(<CardsEditor block={block} onChange={() => undefined} />);
}

describe('CardsEditor — מחלקת וריאציה', () => {
  it('מחיל את מחלקת הווריאציה על השורש (זהה ל-Renderer)', () => {
    const { container } = renderEditor('gradient');
    expect(container.querySelector('.lc-cards--v-gradient')).not.toBeNull();
  });
});
