import { importGeneratedCourse, type GeneratedCourse } from './importGenerated';

/**
 * צד הלקוח של יצירת לומדה מ-AI.
 *
 * שולח את הטקסט לפונקציית ה-serverless (`/api/generate`) — שם, ורק שם, חי מפתח
 * ה-API — ומעביר את ה-JSON הגולמי שחזר דרך `importGeneratedCourse`. הריפוי,
 * הליטוש והאימות רצים כאן בצד הלקוח, לצד העורך וה-stores.
 */

const ENDPOINT = '/api/generate';

export interface GenerateCourseOptions {
  signal?: AbortSignal;
}

export async function generateCourseFromText(
  text: string,
  options: GenerateCourseOptions = {},
): Promise<GeneratedCourse> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as { course?: unknown };
  return importGeneratedCourse(data.course);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === 'string' && data.error) return data.error;
  } catch {
    // גוף לא-JSON — ניפול להודעה גנרית לפי הסטטוס
  }
  return `יצירת הלומדה נכשלה (שגיאה ${response.status}).`;
}
