/**
 * קריאת הבתים של Blob בבדיקות.
 *
 * שני מימושים כי בסביבת הבדיקה מסתובבים שני סוגי Blob: זה של jsdom, שאין
 * לו `arrayBuffer()` ודורש FileReader, וזה שחוזר מ-fake-indexeddb אחרי
 * שכפול מובנה — שיש לו `arrayBuffer()` אבל FileReader של jsdom מסרב לקבלו.
 * עוזר לבדיקות בלבד; קוד המוצר אינו קורא בתים ידנית.
 */
export async function blobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
