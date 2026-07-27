import { render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { findScrollParent, useScrollReveal } from './scrollEffects';

describe('findScrollParent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('מחזיר את האב הגליל הראשון', () => {
    const outer = document.createElement('div');
    outer.style.overflowY = 'auto';
    const inner = document.createElement('div');
    outer.appendChild(inner);
    document.body.appendChild(outer);

    expect(findScrollParent(inner)).toBe(outer);
  });

  it('נופל ל-window כשאין אב גליל', () => {
    const lone = document.createElement('div');
    document.body.appendChild(lone);

    expect(findScrollParent(lone)).toBe(window);
  });
});

function RevealProbe() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref, true);
  return (
    <div ref={ref} className="lc-course">
      <div className="lc-reveal">תוכן</div>
    </div>
  );
}

describe('useScrollReveal', () => {
  const original = globalThis.IntersectionObserver;

  afterEach(() => {
    globalThis.IntersectionObserver = original;
  });

  it('כשאין IntersectionObserver — אינו זורק, אינו מסתיר, והתוכן נשאר גלוי', () => {
    // @ts-expect-error מדמים סביבה בלי IntersectionObserver (jsdom של התוצר)
    delete globalThis.IntersectionObserver;

    const { container } = render(<RevealProbe />);

    // בלי lc-animate-ready מצב ההסתרה ההתחלתי ב-CSS כלל לא חל
    expect(container.querySelector('.lc-course')?.classList.contains('lc-animate-ready')).toBe(
      false,
    );
    expect(screen.getByText('תוכן')).toBeInTheDocument();
  });
});
