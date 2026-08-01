import { describe, expect, it } from 'vitest';
import { defaultTheme } from '@/model/themes';
import { buildImagePrompt, coerceVisualStyle, defaultVisualStyle } from './visualStyle';

describe('defaultVisualStyle', () => {
  it('גוזר את הפלטה מצבעי הערכה', () => {
    const style = defaultVisualStyle(defaultTheme);
    expect(style.palette).toContain(defaultTheme.colors.primary);
    expect(style.palette.length).toBeGreaterThan(0);
    expect(style.artStyle).toContain('illustration');
  });
});

describe('coerceVisualStyle', () => {
  it('מכבד brief תקין מ-AI', () => {
    const style = coerceVisualStyle(
      { artStyle: 'watercolor', palette: ['#ff0000', '#00ff00'], motif: 'leaves' },
      defaultTheme,
    );
    expect(style).toEqual({ artStyle: 'watercolor', palette: ['#ff0000', '#00ff00'], motif: 'leaves' });
  });

  it('מסנן צבעים לא-תקינים ונופל לפלטת הערכה כשלא נשאר כלום', () => {
    const style = coerceVisualStyle({ artStyle: 'x', palette: ['red', 'not-a-color'] }, defaultTheme);
    expect(style.palette).toEqual(defaultVisualStyle(defaultTheme).palette);
  });

  it('נופל לברירת מחדל כשה-brief חסר או פגום', () => {
    expect(coerceVisualStyle(undefined, defaultTheme)).toEqual(defaultVisualStyle(defaultTheme));
    expect(coerceVisualStyle('nonsense', defaultTheme)).toEqual(defaultVisualStyle(defaultTheme));
    expect(coerceVisualStyle({ palette: [] }, defaultTheme).artStyle).toBe(
      defaultVisualStyle(defaultTheme).artStyle,
    );
  });
});

describe('buildImagePrompt', () => {
  it('מוביל בסצנה ואז מוסיף את אילוצי הסגנון המשותפים', () => {
    const prompt = buildImagePrompt(
      { artStyle: 'flat vector', palette: ['#111111', '#222222'], motif: 'circles' },
      'a team meeting',
    );
    expect(prompt).toBe(
      'a team meeting Art style: flat vector. Color palette: #111111, #222222. Recurring motif: circles.',
    );
  });

  it('משמיט פלטה ומוטיב כשאין', () => {
    const prompt = buildImagePrompt({ artStyle: 'flat', palette: [] }, 'a door');
    expect(prompt).toBe('a door Art style: flat.');
  });
});
