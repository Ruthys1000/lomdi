import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * אזור ה-Renderer: הקוד שנארז לתוך הלומדה המיוצאת.
 * כל קובץ כאן חייב להיות נקי מקוד עורך, אחרת הוא ייגרר לחבילת ה-runtime
 * ויתפח את התוצר בקוד שהלומד לא צריך.
 */
const RENDERER_ZONE = [
  'src/renderer/**/*.{ts,tsx}',
  'src/runtime/**/*.{ts,tsx}',
  'src/blocks/*/Renderer.tsx',
  'src/blocks/registry.runtime.ts',
];

/** תלויות שאסור להן להיכנס לחבילת ה-runtime */
const FORBIDDEN_IN_RENDERER = [
  { group: ['@tiptap/*', '@tiptap/**'], message: 'TipTap הוא כלי עריכה — אסור בחבילת ה-runtime.' },
  { group: ['@dnd-kit/*', '@dnd-kit/**'], message: 'dnd-kit הוא כלי עריכה — אסור בחבילת ה-runtime.' },
  { group: ['zustand', 'zustand/*', 'zundo'], message: 'ה-Renderer מקבל נתונים ב-props בלבד, לא מ-store.' },
  { group: ['jszip', 'idb'], message: 'שמירה וייצוא הם באחריות העורך בלבד.' },
  { group: ['@/editor/**', '**/editor/**'], message: 'ה-Renderer לא מייבא קוד עורך.' },
  { group: ['@/state/**', '**/state/**'], message: 'ה-Renderer לא ניגש ל-state של העורך.' },
  { group: ['@/persistence/**', '**/persistence/**'], message: 'ה-Renderer לא ניגש לשכבת השמירה.' },
  { group: ['@/export/**', '**/export/**'], message: 'ה-Renderer לא מייבא את מנגנון הייצוא.' },
  { group: ['@/blocks/registry.editor', '**/registry.editor'], message: 'השתמש ב-registry.runtime, שמכיל רק Renderers.' },
  // ממוקד לתיקיות הבלוקים בכוונה — דפוס רחב כמו '**/Editor' תופס גם נתיבים תמימים
  {
    group: ['@/blocks/*/Editor', '@/blocks/*/Settings', '**/blocks/*/Editor', '**/blocks/*/Settings'],
    message: 'רכיבי Editor/Settings של בלוק שייכים לעורך בלבד — ה-Renderer מייבא רק את Renderer.tsx.',
  },
];

export default tseslint.config(
  { ignores: ['dist', 'public/runtime', 'coverage', 'node_modules'] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // ── הגבול שמחזיק את הארכיטקטורה (ראה סעיף 16 באפיון) ──
  {
    files: RENDERER_ZONE,
    rules: {
      'no-restricted-imports': ['error', { patterns: FORBIDDEN_IN_RENDERER }],
    },
  },

  // קונפיגורציות build רצות ב-Node
  {
    files: ['*.config.ts', 'vite.*.config.ts'],
    languageOptions: { globals: globals.node },
  },

  // בדיקות
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
