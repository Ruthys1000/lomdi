import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import type { EmbeddedCourseData } from '@/runtime/readCourseData';
import { buildExportPayload } from '../payload';
import type { RuntimeBundle } from '../exportZip';
import { buildScormZip } from './scormZip';

const runtime: RuntimeBundle = {
  appJs: '/* חבילת הלומדה */ console.log(1);',
  stylesCss: '.lc-course { color: #111; }',
};

const asset = (id: string): AssetMeta => ({
  id,
  originalName: 'תמונה.png',
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size: 4,
  exportPath: `assets/images/${id}.png`,
});

function courseWithImage(assetId: string) {
  return createCourse({
    title: 'לומדת בטיחות',
    chapters: [
      createChapter({
        title: 'פרק ראשון',
        blocks: [createBlock('image', { content: { ...createBlock('image').content, assetId } })],
      }),
    ],
  });
}

async function loadScorm(payload: EmbeddedCourseData, blobs: Map<string, Blob>) {
  return JSZip.loadAsync(await buildScormZip({ payload, blobs, runtime }));
}

describe('חבילת SCORM', () => {
  it('שמה את imsmanifest.xml ואת הקבצים בשורש הארכיון, בלי תיקיית עטיפה', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await loadScorm(payload, new Map([['asset-a', new Blob([new Uint8Array([1, 2, 3, 4])])]]));
    const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);

    expect(paths).toContain('imsmanifest.xml');
    expect(paths).toContain('index.html');
    expect(paths).toContain('scorm-adapter.js');
    // אין תיקיית שורש עוטפת — index.html ממש בשורש
    expect(paths.every((p) => !p.startsWith('lomdi-'))).toBe(true);
  });

  it('טוען את מתאם ה-SCORM לפני חבילת הריצה ב-index.html', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await loadScorm(payload, new Map([['asset-a', new Blob([new Uint8Array([1])])]]));
    const html = await zip.file('index.html')!.async('string');

    const adapterAt = html.indexOf('scorm-adapter.js');
    const runtimeAt = html.indexOf('runtime/app.js');
    expect(adapterAt).toBeGreaterThan(-1);
    expect(runtimeAt).toBeGreaterThan(-1);
    expect(adapterAt).toBeLessThan(runtimeAt);
  });

  it('המנפסט רושם את הנכס שנארז', async () => {
    const payload = buildExportPayload(courseWithImage('asset-a'), [asset('asset-a')]);
    const zip = await loadScorm(payload, new Map([['asset-a', new Blob([new Uint8Array([1])])]]));
    const manifest = await zip.file('imsmanifest.xml')!.async('string');

    expect(manifest).toContain('assets/images/asset-a.png');
  });
});
