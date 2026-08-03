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

  // רגרסיה: סגירת שכבה פנימית לא תסגור את השכבה החיצונית. זה היה הבאג שבו
  // הוספת בלוק דרך הספרייה החזירה את המשתמש ממסך העריכה למסך הפתיחה.
  it('שכבה חיצונית לא נסגרת כשנסגרת שכבה פנימית מעליה', () => {
    const pushed: unknown[] = [];
    vi.spyOn(window.history, 'pushState').mockImplementation((state) => {
      pushed.push(state);
    });

    const outerClose = vi.fn();
    const innerClose = vi.fn();
    renderHook(() => useBackClose(true, outerClose)); // דוחף את רשומת השכבה החיצונית
    renderHook(() => useBackClose(true, innerClose)); // דוחף את רשומת השכבה הפנימית

    // ה-back של השכבה הפנימית נוחת חזרה על הרשומה של השכבה החיצונית
    window.dispatchEvent(new PopStateEvent('popstate', { state: pushed[0] }));

    expect(outerClose).not.toHaveBeenCalled();
    expect(innerClose).toHaveBeenCalledTimes(1);
  });
});
