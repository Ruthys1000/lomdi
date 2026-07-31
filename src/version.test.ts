// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from './version';

/**
 * `APP_VERSION` מקובע בכוונה (כדי לא לגרור את package.json לחבילת הלומדה),
 * אבל אז הוא עלול לסטות מגרסת החבילה. הבדיקה הזו רצה ב-node, קוראת את
 * package.json ומוודאת שהשניים תואמים — כך הדריפט נתפס ב-CI ולא בתוצר.
 */

describe('APP_VERSION', () => {
  it('תואם לגרסה ב-package.json', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    expect(APP_VERSION).toBe(pkg.version);
  });
});
