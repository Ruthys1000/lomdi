export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** מריץ מיד את הקריאה הממתינה, אם יש — לפני שמירה או ניתוק רכיב */
  flush: () => void;
  cancel: () => void;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | undefined;

  const run = () => {
    if (!pending) return;
    const args = pending;
    pending = undefined;
    timer = undefined;
    fn(...args);
  };

  const debounced = ((...args: A) => {
    pending = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, wait);
  }) as Debounced<A>;

  debounced.flush = () => {
    if (timer) clearTimeout(timer);
    run();
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  return debounced;
}
