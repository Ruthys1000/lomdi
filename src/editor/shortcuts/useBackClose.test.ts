import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBackClose } from './useBackClose';

/**
 * הבדיקה מכסה את שלושת הצירים של ה-hook: דחיפת רשומה בפתיחה, סגירה בלחיצת
 * "חזרה" (popstate), וניקוי הרשומה כשנסגר מבפנים. jsdom תומך ב-pushState/back,
 * ואירוע popstate נשלח ידנית כי jsdom לא מדמה ניווט אמיתי.
 */
describe('useBackClose', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('לא דוחף רשומה כשלא פעיל', () => {
    const push = vi.spyOn(window.history, 'pushState');
    renderHook(() => useBackClose(false, vi.fn()));
    expect(push).not.toHaveBeenCalled();
  });

  it('דוחף רשומת היסטוריה כשנפתח', () => {
    const push = vi.spyOn(window.history, 'pushState');
    renderHook(() => useBackClose(true, vi.fn()));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('לחיצת חזרה (popstate) קוראת ל-onClose', () => {
    const onClose = vi.fn();
    renderHook(() => useBackClose(true, onClose));

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('סגירה מבפנים מנקה את הרשומה ב-history.back', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { unmount } = renderHook(() => useBackClose(true, vi.fn()));

    unmount();
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('סגירה בלחיצת חזרה לא קוראת שוב ל-history.back', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { unmount } = renderHook(() => useBackClose(true, vi.fn()));

    window.dispatchEvent(new PopStateEvent('popstate'));
    unmount();
    expect(back).not.toHaveBeenCalled();
  });
});
