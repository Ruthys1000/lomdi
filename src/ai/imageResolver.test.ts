import { describe, expect, it } from 'vitest';
import { endpointImageResolver } from './imageResolver';

describe('endpointImageResolver', () => {
  it('בונה כתובת מאותו origin עם קידוד השאילתה', async () => {
    const url = await endpointImageResolver.resolve('modern office');
    expect(url).toBe('/api/image?q=modern%20office');
  });

  it('מחזיר null לשאילתה ריקה', async () => {
    expect(await endpointImageResolver.resolve('   ')).toBeNull();
  });
});
