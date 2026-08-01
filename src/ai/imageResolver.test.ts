import { describe, expect, it } from 'vitest';
import { createGeneratedImageResolver, endpointImageResolver } from './imageResolver';
import type { VisualStyle } from './visualStyle';

describe('endpointImageResolver', () => {
  it('בונה כתובת מאותו origin עם קידוד השאילתה', async () => {
    const url = await endpointImageResolver.resolve('modern office');
    expect(url).toBe('/api/image?q=modern%20office');
  });

  it('מחזיר null לשאילתה ריקה', async () => {
    expect(await endpointImageResolver.resolve('   ')).toBeNull();
  });
});

describe('createGeneratedImageResolver', () => {
  const style: VisualStyle = { artStyle: 'flat vector', palette: ['#112233'], motif: 'arcs' };

  it('בונה כתובת ל-/api/generate-image עם ה-prompt המלא (סצנה + סגנון)', async () => {
    const url = await createGeneratedImageResolver(style).resolve('a team meeting');
    expect(url).toContain('/api/generate-image?prompt=');
    const prompt = decodeURIComponent(url!.split('prompt=')[1]);
    expect(prompt).toContain('a team meeting');
    expect(prompt).toContain('flat vector');
    expect(prompt).toContain('#112233');
    expect(prompt).toContain('arcs');
  });

  it('מחזיר null לשאילתה ריקה', async () => {
    expect(await createGeneratedImageResolver(style).resolve('  ')).toBeNull();
  });
});
