import type { ComponentType } from 'react';
import type { Block } from '@/model/types';
import { HeroRenderer } from './hero/Renderer';
import { RichTextRenderer } from './richText/Renderer';
import { ImageRenderer } from './image/Renderer';
import { TextImageRenderer } from './textImage/Renderer';
import { DividerRenderer } from './divider/Renderer';

/**
 * רגיסטרי ה-Renderers — הצד שנארז לתוך הלומדה המיוצאת.
 *
 * הוא מופרד בכוונה מ-registry.editor: אילו היה רגיסטרי אחד שמחזיק גם
 * EditorComponent וגם RendererComponent, כל ייבוא שלו היה גורר את TipTap,
 * את dnd-kit ואת zod לחבילת ה-runtime. כאן נכנסים Renderers בלבד.
 */

export interface BlockRendererProps<C = unknown> {
  block: Block & { content: C };
}

export type BlockRendererComponent<C = unknown> = ComponentType<BlockRendererProps<C>>;

const registry = {
  hero: HeroRenderer,
  richText: RichTextRenderer,
  image: ImageRenderer,
  textImage: TextImageRenderer,
  divider: DividerRenderer,
  // כרטיסים, אקורדיון, וידאו ושאלת בחירה מתווספים בשלב 5
} as unknown as Record<string, BlockRendererComponent>;

export const rendererRegistry = registry;

export function getRenderer(type: string): BlockRendererComponent | undefined {
  return registry[type];
}
