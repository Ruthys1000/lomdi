import type { ComponentType } from 'react';
import {
  Columns2,
  Heading1,
  Image as ImageIcon,
  LayoutGrid,
  ListCollapse,
  Minus,
  PlayCircle,
  Quote as QuoteIcon,
  SquareCheckBig,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { BlockContent, BlockOf } from '@/model/types';
import { getSharedBlockDefinition, type BlockCategory } from './registry.shared';

import { HeroEditor } from './hero/Editor';
import { HeroSettings } from './hero/Settings';
import { RichTextBlockEditor } from './richText/Editor';
import { RichTextSettings } from './richText/Settings';
import { ImageSettings } from './image/Settings';
import { TextImageEditor } from './textImage/Editor';
import { TextImageSettings } from './textImage/Settings';
import { DividerSettings } from './divider/Settings';
import { CardsEditor } from './cards/Editor';
import { CardsSettings } from './cards/Settings';
import { AccordionEditor } from './accordion/Editor';
import { AccordionSettings } from './accordion/Settings';
import { VideoSettings } from './video/Settings';
import { QuizEditor } from './quiz/Editor';
import { QuizSettings } from './quiz/Settings';
import { QuoteSettings } from './quote/Settings';

/**
 * הרגיסטרי של העורך — Editor, Settings ואייקונים.
 *
 * הקובץ הזה נשאר מחוץ לחבילת הלומדה: הוא מייבא TipTap דרך רכיבי ה-Editor,
 * ואת lucide המלא דרך האייקונים. כלל ה-ESLint שאוסר על אזור הרנדרר לייבא
 * ממנו הוא מה ששומר על ההפרדה.
 *
 * EditorComponent הוא אופציונלי: בלוק בלי עריכה ישירה (תמונה, מפריד)
 * מוצג בקנבס דרך ה-Renderer שלו, ונערך מפאנל ההגדרות בלבד.
 */

export interface BlockEditorProps<C = BlockContent> {
  block: BlockOf<C>;
  onChange: (content: C) => void;
}

export interface EditorBlockDefinition {
  type: string;
  label: string;
  description: string;
  category: BlockCategory;
  icon: LucideIcon;
  EditorComponent?: ComponentType<BlockEditorProps<never>>;
  SettingsComponent?: ComponentType<BlockEditorProps<never>>;
}

interface Registration {
  icon: LucideIcon;
  EditorComponent?: unknown;
  SettingsComponent?: unknown;
}

const registrations: Record<string, Registration> = {
  hero: { icon: Heading1, EditorComponent: HeroEditor, SettingsComponent: HeroSettings },
  richText: { icon: Type, EditorComponent: RichTextBlockEditor, SettingsComponent: RichTextSettings },
  image: { icon: ImageIcon, SettingsComponent: ImageSettings },
  textImage: { icon: Columns2, EditorComponent: TextImageEditor, SettingsComponent: TextImageSettings },
  divider: { icon: Minus, SettingsComponent: DividerSettings },
  cards: { icon: LayoutGrid, EditorComponent: CardsEditor, SettingsComponent: CardsSettings },
  accordion: {
    icon: ListCollapse,
    EditorComponent: AccordionEditor,
    SettingsComponent: AccordionSettings,
  },
  // לווידאו אין עריכה ישירה: הוא נערך מהפאנל, כמו תמונה ומפריד
  video: { icon: PlayCircle, SettingsComponent: VideoSettings },
  quiz: { icon: SquareCheckBig, EditorComponent: QuizEditor, SettingsComponent: QuizSettings },
  // לציטוט אין עריכה ישירה בקנבס: נערך מהפאנל, כמו תמונה ומפריד
  quote: { icon: QuoteIcon, SettingsComponent: QuoteSettings },
};

function build(type: string): EditorBlockDefinition | undefined {
  const shared = getSharedBlockDefinition(type);
  const registration = registrations[type];
  if (!shared || !registration) return undefined;

  return {
    type,
    label: shared.label,
    description: shared.description,
    category: shared.category,
    icon: registration.icon,
    EditorComponent: registration.EditorComponent as EditorBlockDefinition['EditorComponent'],
    SettingsComponent: registration.SettingsComponent as EditorBlockDefinition['SettingsComponent'],
  };
}

export const editorBlockRegistry: Record<string, EditorBlockDefinition> = Object.fromEntries(
  Object.keys(registrations)
    .map((type) => [type, build(type)] as const)
    .filter((entry): entry is [string, EditorBlockDefinition] => entry[1] !== undefined),
);

export function getEditorBlockDefinition(type: string): EditorBlockDefinition | undefined {
  return editorBlockRegistry[type];
}

export const editorBlockList = Object.values(editorBlockRegistry);
