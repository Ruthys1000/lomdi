import { createRoot } from 'react-dom/client';
import type { AssetMeta } from '@/model/types';
import { CourseRenderer } from '@/renderer/CourseRenderer';
import { loadCourseData } from './readCourseData';

/**
 * נקודת הכניסה של הלומדה המיוצאת.
 *
 * זהו כל הקוד שהלומד מקבל: קריאת ה-JSON המוטמע, ורינדור של אותו
 * CourseRenderer שהעורך מציג בתצוגה מקדימה. אין כאן שום קוד עריכה.
 */

const ROOT_ID = 'lc-root';

/** בתוצר, כל נכס נטען מנתיב יחסי — לעולם לא מ-blob: או מ-localhost */
function createAssetResolver(assets: AssetMeta[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset.exportPath]));
  return (assetId: string) => byId.get(assetId);
}

function renderError(container: HTMLElement, message: string) {
  container.innerHTML = '';
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText =
    'max-width:640px;margin:15vh auto;padding:24px;font-family:system-ui,sans-serif;' +
    'text-align:center;line-height:1.7;color:#0f172a';
  box.textContent = message;
  container.appendChild(box);
}

async function start() {
  const container = document.getElementById(ROOT_ID);
  if (!container) return;

  const data = await loadCourseData();

  if (!data?.course) {
    renderError(container, 'לא נמצאו נתוני לומדה. ודא שקובץ index.html לא נערך ידנית.');
    return;
  }

  document.documentElement.lang = data.course.language;
  document.documentElement.dir = data.course.direction;
  if (data.course.title) document.title = data.course.title;

  createRoot(container).render(
    <CourseRenderer course={data.course} resolveAssetUrl={createAssetResolver(data.assets ?? [])} />,
  );
}

void start();
