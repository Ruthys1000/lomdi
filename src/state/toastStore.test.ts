import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from './toastStore';

/**
 * הבחנה מרכזית: טוסט רגיל נעלם לבד אחרי כמה שניות, אבל טוסט `durable`
 * (כשל שאסור שיתפספס) נשאר עד סגירה ידנית. הבדיקה משתמשת בטיימרים מזויפים
 * כדי לוודא שהטיימר אכן לא מוסר טוסט עמיד.
 */
describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('טוסט רגיל נעלם לבד אחרי הזמן הקצוב', () => {
    useToastStore.getState().show('נשמר');
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('טוסט durable נשאר עד סגירה ידנית', () => {
    useToastStore.getState().show('תמונה לא נטענה', { tone: 'error', durable: true });
    const id = useToastStore.getState().toasts[0].id;

    vi.advanceTimersByTime(60_000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
