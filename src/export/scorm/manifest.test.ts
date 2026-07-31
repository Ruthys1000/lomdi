import { describe, expect, it } from 'vitest';
import { SCORM_MANIFEST_FILE, buildManifest } from './manifest';

/**
 * המנפסט הוא מה ש-Moodle קורא כדי לזהות את הלומדה. הבדיקות מוודאות שהוא
 * תקין כ-XML, שהכותרת (קלט משתמש) מוברחת, ושרשימת הקבצים נכונה.
 */

describe('buildManifest', () => {
  const files = ['index.html', 'scorm-adapter.js', 'runtime/app.js', 'assets/images/a.png'];

  it('הוא XML תקין שנפרס בלי שגיאות', () => {
    const xml = buildManifest('בטיחות בעבודה', files);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.tagName).toBe('manifest');
  });

  it('מצהיר על SCORM 1.2 ועל SCO עם index.html כנקודת כניסה', () => {
    const xml = buildManifest('קורס', files);
    expect(xml).toContain('<schemaversion>1.2</schemaversion>');
    expect(xml).toMatch(/adlcp:scormtype="sco"/);
    expect(xml).toMatch(/href="index\.html"/);
  });

  it('רושם את כל הקבצים חוץ מהמנפסט עצמו', () => {
    const xml = buildManifest('קורס', [...files, SCORM_MANIFEST_FILE]);
    for (const path of files) {
      expect(xml).toContain(`<file href="${path}" />`);
    }
    expect(xml).not.toContain(`<file href="${SCORM_MANIFEST_FILE}" />`);
  });

  it('מבריח כותרת עם תווים שמסוכנים ל-XML', () => {
    const xml = buildManifest('דו"ח <script> & סיכום', files);
    expect(xml).not.toContain('<script>');
    expect(xml).toContain('&lt;script&gt;');
    expect(xml).toContain('&amp;');
    // עדיין נפרס תקין
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
  });

  it('מזהה החבילה הוא ASCII חוקי גם לכותרת עברית-בלבד', () => {
    const xml = buildManifest('לומדה', files);
    const id = xml.match(/identifier="([^"]+)"/)?.[1] ?? '';
    expect(id).toMatch(/^LOMDI_[A-Za-z0-9_]*$/);
  });
});
