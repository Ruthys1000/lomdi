import '@testing-library/jest-dom/vitest';

/*
 * jsdom לא תמיד מממש את dialog.showModal/close (משמשים במודלים ובמגירת
 * "הלומדות שלי"). polyfill מינימלי ומוגן — חל רק אם המימוש חסר, כך שהוא
 * לא נוגע בדפדפן אמיתי ולא בגרסאות jsdom שכבר תומכות.
 */
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
