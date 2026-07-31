import { escapeHtml } from '../indexHtml';

/**
 * `imsmanifest.xml` — קובץ התיאור שמודל קורא כדי לדעת מהי הלומדה ואיפה
 * נקודת הכניסה שלה.
 *
 * SCORM 1.2, SCO יחיד. הקובץ יושב **בשורש** ה-ZIP (בניגוד לייצוא הרגיל
 * שאורז תחת תיקיית שורש אחת), כי כך מוגדר PIF שמודל מייבא.
 *
 * הכותרת היא קלט משתמש ולכן מוברחת דרך `escapeHtml` — אותה פונקציה שמגינה
 * על ה-HTML. מזהה החבילה נגזר מהתאריך והכותרת כדי להיות יציב ו-XML-בטוח.
 */

export const SCORM_MANIFEST_FILE = 'imsmanifest.xml';

/** מזהה ASCII חוקי ל-XML — אותיות, ספרות וקו-תחתון בלבד */
function manifestId(title: string): string {
  const slug = title
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return `LOMDI_${slug || 'course'}`;
}

export function buildManifest(title: string, filePaths: string[]): string {
  const id = manifestId(title);
  const safeTitle = escapeHtml(title || 'לומדה');
  // כל קובצי החבילה נרשמים כ-<file> תחת ה-resource. imsmanifest.xml עצמו
  // אינו נרשם — הוא המתאר, לא משאב.
  const files = filePaths
    .filter((path) => path !== SCORM_MANIFEST_FILE)
    .map((path) => `      <file href="${escapeHtml(path)}" />`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${id}">
    <organization identifier="ORG-${id}">
      <title>${safeTitle}</title>
      <item identifier="ITEM-${id}" identifierref="RES-${id}" isvisible="true">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-${id}" type="webcontent" adlcp:scormtype="sco" href="index.html">
${files}
    </resource>
  </resources>
</manifest>
`;
}
