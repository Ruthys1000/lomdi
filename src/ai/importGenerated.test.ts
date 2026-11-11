import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@/model/types';
import { validateProjectFile } from '@/model/validate';
import { formatExample } from '../../api/generate';
import { importGeneratedCourse } from './importGenerated';

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

describe('importGeneratedCourse', () => {
  it('צינור מלא: JSON גולמי → לומדה ערוכה ומאומתת', () => {
    const { course, warnings } = importGeneratedCourse({
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

    // הפרומפט המומלץ לתמונה נשמר בתוכן הבלוק (placeholder בלבד)
    const imageBlock = course.chapters[0].blocks.find((b) => b.type === 'image');
    expect((imageBlock?.content as { imagePrompt: string } | undefined)?.imagePrompt).toBe('מנעול דיגיטלי');

    // התוצר עובר את אותו אימות של טעינת קובץ פרויקט
    const validation = validateProjectFile(
      roundTrip({
        version: SCHEMA_VERSION,
        generator: { name: 'Learnit', version: '0.1.0' },
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

  it('דוגמת הפורמט "מסלול למידה" עוברת את הייבוא בלי אזהרות, כמסלול ליניארי בפרקים', () => {
    const { course, warnings } = importGeneratedCourse(formatExample('journey'), {
      format: 'journey',
    });

    expect(warnings).toEqual([]);
    expect(course.format).toBe('journey');
    expect(course.navigation.mode).toBe('chapters');
    expect(course.navigation.sequence).toBe('linear');
    expect(course.chapters).toHaveLength(3);
    // לכל פרק מטרת למידה, ויש שאלות בדרך ובסיכום
    expect(course.chapters.every((chapter) => chapter.description.length > 0)).toBe(true);
    const quizzes = course.chapters.flatMap((c) => c.blocks).filter((b) => b.type === 'quiz');
    expect(quizzes).toHaveLength(2);
  });
});
