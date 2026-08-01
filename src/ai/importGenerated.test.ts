import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@/model/types';
import { validateProjectFile } from '@/model/validate';
import { importGeneratedCourse } from './importGenerated';

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

describe('importGeneratedCourse', () => {
  it('צינור מלא: JSON גולמי → לומדה ערוכה ומאומתת', () => {
    const { course, warnings, imageIntents } = importGeneratedCourse({
      title: 'אבטחת מידע',
      chapters: [
        {
          title: 'מבוא',
          blocks: [
            { type: 'richText', content: { doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'טקסט' }] }] } } },
            { type: 'image', content: { query: 'מנעול דיגיטלי', alt: 'מנעול' } },
          ],
        },
      ],
    });

    // refine הוסיף מסך פתיחה
    expect(course.chapters[0].blocks[0].type).toBe('hero');
    expect(warnings.some((w) => w.includes('פתיחה'))).toBe(true);

    // כוונת התמונה נשמרה לפתירה מאוחרת
    expect(imageIntents).toHaveLength(1);

    // התוצר עובר את אותו אימות של טעינת קובץ פרויקט
    const validation = validateProjectFile(
      roundTrip({
        version: SCHEMA_VERSION,
        generator: { name: 'לומדי', version: '0.1.0' },
        savedAt: new Date().toISOString(),
        course,
        assets: [],
      }),
    );
    expect(validation.ok).toBe(true);
    expect(warnings.some((w) => w.includes('אימות סופי'))).toBe(false);
  });

  it('refine=false מדלג על תוספות העריכה', () => {
    const { course } = importGeneratedCourse(
      { chapters: [{ blocks: [{ type: 'richText', content: {} }] }] },
      { refine: false },
    );
    expect(course.chapters[0].blocks[0].type).toBe('richText');
  });
});
