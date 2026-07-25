/**
 * הורדת קובץ שנוצר בדפדפן.
 *
 * הכתובת משוחררת בטיימאאוט ולא מיד: חלק מהדפדפנים קוראים את ה-Blob אחרי
 * שהאירוע מסתיים, ושחרור מיידי היה מייצר הורדה של קובץ ריק.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
