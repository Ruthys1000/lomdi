import { describe, expect, it } from 'vitest';
import { estimateProgressPercent } from './GenerateForm';

describe('estimateProgressPercent', () => {
  it('מתחילה מאפס ולא מגיעה ל־100% גם אחרי זמן ארוך', () => {
    expect(estimateProgressPercent(0)).toBe(0);
    expect(estimateProgressPercent(150)).toBe(90);
    expect(estimateProgressPercent(600)).toBe(90);
  });

  it('עולה בהדרגה בטווח 2–3 דקות', () => {
    const early = estimateProgressPercent(30);
    const mid = estimateProgressPercent(90);
    const late = estimateProgressPercent(140);
    expect(early).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
    expect(late).toBeLessThanOrEqual(90);
  });
});
