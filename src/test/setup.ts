import '@testing-library/jest-dom/vitest';

/*
 * jsdom לא תמיד מממש את dialog.showModal/close (משמשים במודלים ובמגירת
 * "הלומדות שלי"). polyfill מינימלי ומוגן — חל רק אם המימוש חסר, כך שהוא
 * לא נוגע בדפדפן אמיתי ולא בגרסאות jsdom שכבר תומכות.
 */
/*
 * jsdom אינו מממש את ResizeObserver ואת URL.createObjectURL — שניהם
 * נדרשים לתצוגות החיות (תצוגה מקדימה של לומדה, מודלים ומגירות). polyfill
 * מינימלי ומוגן, כך שהוא לא נוגע בדפדפן אמיתי.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => {};
}

if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype;
  if (!proto.showModal) {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (!proto.close) {
    proto.close = function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  }
}
