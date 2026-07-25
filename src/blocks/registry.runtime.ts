import type { ComponentType } from 'react';
import type { Block } from '@/model/types';

/**
 * רגיסטרי ה-Renderers — הצד שנארז לתוך הלומדה המיוצאת.
 *
 * הוא מופרד בכוונה מ-registry.editor.ts: אילו היה רגיסטרי אחד שמחזיק גם
 * EditorComponent וגם RendererComponent, כל ייבוא שלו היה גורר את TipTap
 * ואת dnd-kit לתוך חבילת ה-runtime. כאן נכנסים Renderers בלבד.
 */

export interface BlockRendererProps<C = unknown> {
  block: Block & { content: C };
}

export type BlockRendererComponent<C = unknown> = ComponentType<BlockRendererProps<C>>;

/** מתמלא בשלבים 3 ו-5 עם רכיבי ה-Renderer של כל סוג בלוק */
export const rendererRegistry: Record<string, BlockRendererComponent> = {};

export function getRenderer(type: string): BlockRendererComponent | undefined {
  return rendererRegistry[type];
}
