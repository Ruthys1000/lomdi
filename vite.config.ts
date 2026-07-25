import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Build של אפליקציית העורך (האולפן).
 *
 * שים לב: חבילת ה-runtime של הלומדה נבנית בנפרד, ב-vite.runtime.config.ts,
 * אל תוך public/runtime/. הסקריפט `npm run build` מריץ אותה קודם,
 * ו-`npm run predev` דואג לכך גם בפיתוח — כדי שהייצוא תמיד ישלח רנדרר עדכני.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
  },
});
