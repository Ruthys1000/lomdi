import { describe, expect, it } from 'vitest';
import { estimateProgressPercent, formatElapsed, statusLineFor } from './generateWait';

describe('generateWait helpers', () => {
  it('מעריכה התקדמות שמתחילה מאפס ולא מגיעה ל־100%', () => {
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

  it('מעצבת זמן כ־m:ss', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(75)).toBe('1:15');
  });

  it('מחליפה הודעה בניסיון חוזר', () => {
    expect(statusLineFor(10, 'retrying')).toContain('מנסים שוב');
  });
});
