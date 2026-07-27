import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createBlock } from '@/model/factory';
import type { BlockOf } from '@/model/types';
import { createHeroContent, type HeroContent } from './content';
import { HeroEditor } from './Editor';

/**
 * שומר מפני סחף: מחלקת הווריאציה חייבת להופיע גם ב-Editor (הקנבס מציג אותו
 * במקום ה-Renderer בזמן עריכה). בלי זה שינוי וריאציה נראה רק בתצוגה המקדימה.
 */
function renderEditor(variant: HeroContent['variant']) {
  const block = createBlock('hero', {
    content: createHeroContent({ variant }),
  }) as BlockOf<HeroContent>;
  return render(<HeroEditor block={block} onChange={() => undefined} />);
}

describe('HeroEditor — מחלקת וריאציה', () => {
  it('מחיל את מחלקת הווריאציה על השורש (זהה ל-Renderer)', () => {
    const { container } = renderEditor('spotlight');
    expect(container.querySelector('.lc-hero--v-spotlight')).not.toBeNull();
  });
});
