import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Build של חבילת ה-runtime של הלומדה.
 *
 * זו החבילה שנארזת לתוך ה-ZIP המיוצא (runtime/app.js + runtime/styles.css).
 * היא מכילה React + CourseRenderer + רכיבי ה-Renderer של הבלוקים בלבד —
 * ולא שום קוד עורך. הגבול הזה נאכף בכלל ESLint (ראה eslint.config.js).
 *
 * התוצר הוא IIFE יחיד ללא תלות חיצונית, כדי שהלומדה תרוץ מ-file:// בלי שרת
 * ובלי CDN.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    // מבטיח build של React במצב production גם כשנבנה כספרייה
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'public/runtime',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/runtime/main.tsx', import.meta.url)),
      formats: ['iife'],
      name: 'LearnItRuntime',
      fileName: () => 'app.js',
    },
    rollupOptions: {
      output: {
        // שמות קבועים — הייצוא מפנה אליהם בנתיב יחסי
        assetFileNames: 'styles.css',
        inlineDynamicImports: true,
      },
    },
  },
});
