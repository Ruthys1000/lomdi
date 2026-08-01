/**
 * שכבת ההכנה ל-AI.
 *
 * כל מה שכאן הוא טרנספורמציית-נתונים בצד העורך, ואגנוסטי לאיך שה-LLM ייקרא
 * בסוף (serverless או מפתח-משתמש). אין כאן קריאת מודל, מפתחות או backend.
 * הגבול נשמר: המודול לא נצרך על ידי `src/renderer/**` או `src/runtime/**`.
 */

export { buildGenerationContract } from './contract';
export type { BlockContract, GenerationContract } from './contract';

export { coerceGeneratedCourse } from './coerceCourse';
export type { CoerceResult } from './coerceCourse';

export { refineCourse } from './refineCourse';
export type { RefineResult } from './refineCourse';

export { importGeneratedCourse } from './importGenerated';
export type { GeneratedCourse, ImportGeneratedOptions } from './importGenerated';

export { generateCourseFromText } from './generateCourse';
export type { GenerateCourseOptions } from './generateCourse';

export { readImageHint } from './imageIntent';
export type { ImageField, ImageHint, ImageIntent } from './imageIntent';

export { resolveImageIntents, placeholderIllustration } from './images';
export type {
  ImageResolver,
  ResolvedAsset,
  ResolveImageIntentsOptions,
  ResolveImageIntentsResult,
} from './images';

export { sanitizeRichText } from './sanitizeRichText';
export type { SanitizeRichTextResult } from './sanitizeRichText';
