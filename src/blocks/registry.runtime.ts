import type { ComponentType } from 'react';
import type { Block } from '@/model/types';
import { HeroRenderer } from './hero/Renderer';
import { RichTextRenderer } from './richText/Renderer';
import { ImageRenderer } from './image/Renderer';
import { TextImageRenderer } from './textImage/Renderer';
import { DividerRenderer } from './divider/Renderer';
import { CardsRenderer } from './cards/Renderer';
import { AccordionRenderer } from './accordion/Renderer';
import { VideoRenderer } from './video/Renderer';
import { QuizRenderer } from './quiz/Renderer';
import { QuoteRenderer } from './quote/Renderer';
import { CalloutRenderer } from './callout/Renderer';
import { StepsRenderer } from './steps/Renderer';
import { ChecklistRenderer } from './checklist/Renderer';

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
  cards: CardsRenderer,
  accordion: AccordionRenderer,
  video: VideoRenderer,
  quiz: QuizRenderer,
  quote: QuoteRenderer,
  callout: CalloutRenderer,
  steps: StepsRenderer,
  checklist: ChecklistRenderer,
} as unknown as Record<string, BlockRendererComponent>;

export const rendererRegistry = registry;

export function getRenderer(type: string): BlockRendererComponent | undefined {
  return registry[type];
}
