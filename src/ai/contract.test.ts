import { describe, expect, it } from 'vitest';
import { blockTypes } from '@/blocks/registry.shared';
import { buildGenerationContract } from './contract';
import { importGeneratedCourse } from './importGenerated';

describe('buildGenerationContract', () => {
  const contract = buildGenerationContract();

  it('כוללת סכמת JSON לכל סוג בלוק רשום', () => {
    const contractTypes = contract.blocks.map((b) => b.type).sort();
    expect(contractTypes).toEqual([...blockTypes].sort());
    for (const block of contract.blocks) {
      expect(block.schema).toBeTruthy();
      expect(block.label).toBeTruthy();
    }
  });

  it('כוללת סכמת קורס, ערכות עיצוב ורשימה לבנה של טקסט עשיר', () => {
    expect(contract.course).toBeTruthy();
    expect(contract.themes.length).toBeGreaterThan(0);
    expect(contract.richText.nodes).toContain('paragraph');
    expect(contract.richText.marks).toContain('bold');
  });

  it('דוגמת ה-few-shot עוברת נקי דרך שכבת הקליטה', () => {
    const { course, warnings } = importGeneratedCourse(contract.example);
    // הדוגמה נכתבה מול החוזה, ולכן אסור שיהיו בה בלוקים לא מוכרים או כשל אימות
    expect(warnings.some((w) => w.includes('לא מוכר'))).toBe(false);
    expect(warnings.some((w) => w.includes('אימות סופי'))).toBe(false);
    expect(course.chapters[0].blocks[0].type).toBe('hero');
  });
});
