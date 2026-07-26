import { describe, expect, it } from 'vitest';
import { createSampleCourse } from '@/sample/sampleCourse';
import { createBlock, createChapter, createCourse } from './factory';
import { SCHEMA_VERSION, type ProjectFile } from './types';
import { validateProjectFile } from './validate';

function projectFile(overrides: Partial<ProjectFile> = {}): ProjectFile {
  return {
    version: SCHEMA_VERSION,
    generator: { name: 'LearnIt', version: '0.1.0' },
    savedAt: new Date().toISOString(),
    course: createCourse(),
    assets: [],
    ...overrides,
  };
}

/** מדמה מעבר דרך קובץ: מה שלא שורד JSON לא ישרוד גם שמירה אמיתית */
const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

describe('validateProjectFile', () => {
  it('מקבלת קובץ תקין', () => {
    const result = validateProjectFile(roundTrip(projectFile()));

    expect(result.ok).toBe(true);
  });

  it('מקבלת את לומדת הדוגמה על כל סוגי הבלוקים שבה', () => {
    const project = projectFile({ course: createSampleCourse().course });
    const result = validateProjectFile(roundTrip(project));

    if (!result.ok) throw new Error(`נכשל: ${result.errors.join(', ')}`);
    expect(result.project.course.chapters).toHaveLength(4);
  });

  it('שומרת על התוכן במעבר הלוך ושוב דרך JSON', () => {
    const project = projectFile({ course: createSampleCourse().course });
    const result = validateProjectFile(roundTrip(project));

    if (!result.ok) throw new Error('אימות נכשל');
    expect(result.project).toEqual(roundTrip(project));
  });

  it('דוחה קובץ שאינו אובייקט', () => {
    for (const value of ['טקסט', 42, null, [], undefined]) {
      const result = validateProjectFile(value);
      expect(result.ok).toBe(false);
    }
  });

  it('דוחה קובץ בלי מספר גרסה ומסבירה למה', () => {
    const { version: _version, ...withoutVersion } = projectFile();
    const result = validateProjectFile(withoutVersion);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('גרסה');
  });

  it('דוחה קובץ מגרסה עתידית ומפנה לעדכן את המחולל', () => {
    const result = validateProjectFile(projectFile({ version: '9.0' }));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('9.0');
    expect(result.errors[0]).toContain('עדכן');
  });

  it('דוחה בלוק מסוג שאינו מוכר', () => {
    const project = roundTrip(projectFile());
    project.course.chapters[0].blocks = [
      { id: 'block-1', type: 'blockמהעתיד', content: {}, settings: createBlock('richText').settings },
    ];

    const result = validateProjectFile(project);
    expect(result.ok).toBe(false);
  });

  it('דוחה בלוק שהתוכן שלו אינו תואם לסוג שלו', () => {
    const project = roundTrip(projectFile());
    project.course.chapters[0].blocks = [
      { ...roundTrip(createBlock('quiz')), content: { question: 'שאלה', options: 'לא מערך' } },
    ];

    const result = validateProjectFile(project);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('שאלת בחירה');
  });

  it('דוחה צבע לא תקין בערכת העיצוב', () => {
    const project = roundTrip(projectFile());
    project.course.theme.colors.primary = 'כחול';

    expect(validateProjectFile(project).ok).toBe(false);
  });

  it('תופסת מזהים כפולים, שהסכמה עצמה אינה מזהה', () => {
    const shared = createBlock('richText');
    const project = projectFile({
      course: createCourse({
        chapters: [
          createChapter({ blocks: [shared] }),
          createChapter({ blocks: [{ ...shared }] }),
        ],
      }),
    });

    const result = validateProjectFile(roundTrip(project));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('מזהים כפולים');
  });

  it('דוחה שם קובץ נכס שאינו ASCII, כי הוא נכתב לתוך ה-ZIP', () => {
    const project = roundTrip(projectFile());
    project.assets = [
      {
        id: 'asset-1',
        originalName: 'תמונת פתיחה.jpg',
        safeName: 'תמונת פתיחה.jpg',
        kind: 'image',
        mimeType: 'image/jpeg',
        size: 1024,
        exportPath: 'assets/images/x.jpg',
      },
    ];

    const result = validateProjectFile(project);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toContain('לטיניות');
  });

  it('מגבילה את מספר השגיאות המדווחות כדי שההודעה תישאר קריאה', () => {
    const project = roundTrip(projectFile());
    project.course.theme.colors = {
      primary: 'x', secondary: 'x', accent: 'x', background: 'x',
      surface: 'x', text: 'x', textMuted: 'x', border: 'x',
    };

    const result = validateProjectFile(project);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.length).toBeLessThanOrEqual(6);
    expect(result.errors.at(-1)).toContain('ועוד');
  });
});
