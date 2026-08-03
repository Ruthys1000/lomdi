# AGENTS.md

## Cursor Cloud specific instructions

Lomdi (לומדי) is a single web product: a block-based HTML learning-module ("lomda") generator with a Hebrew/RTL UI. It is a browser-only React 19 + Vite 6 + TypeScript SPA that persists work in IndexedDB and exports self-contained HTML course ZIPs. The only backend is one optional Vercel serverless function (`api/generate.ts`) that calls Anthropic Claude to generate a course from pasted text. There is no database and no docker/compose.

The update script already runs `npm ci` on startup, so dependencies are installed. Node 20+ is required (the VM has Node 22, which works). Standard commands live in `package.json` `scripts` — refer to them rather than re-deriving.

Non-obvious caveats:

- Run the editor with `npm run dev` (Vite, http://localhost:5173). This is the whole product for editing/saving/exporting.
- `dev`, `test`, and `build` each auto-run `build:assets` first (via `predev`/`pretest`/`prebuild`). `build:assets` extracts fonts into `public/fonts/` and builds the course runtime IIFE into `public/runtime/`. Course export fails if `public/runtime/` is missing, so never run the editor in a way that skips `build:assets`. `public/fonts/` and `public/runtime/` are build outputs (gitignored) — regenerate with `npm run build:assets` if absent.
- Two separate bundles are built from one source: the editor app (`vite.config.ts` → `dist/`) and the exported course runtime (`vite.runtime.config.ts` → `public/runtime/app.js`).
- The AI "generate course from text" feature is the only part that hits the network. The client calls the relative path `/api/generate`, which does NOT exist under plain `npm run dev`. To exercise AI generation end-to-end you must install the Vercel CLI and run `vercel dev` (serves `/api/generate` on port 3000) with `ANTHROPIC_API_KEY` set in `.env` (see `.env.example`). Everything else (create/edit/save/import/export) works with zero env vars and no key.
- To test the core product without any secrets, use the "התחילו מדף ריק" (start from a blank page) link on the landing hero — it creates a blank course and opens the editor without touching the AI backend.
- Quality gates (same as CI in `.github/workflows/ci.yml`): `npm run lint`, `npm run typecheck`, `npm test` (Vitest, jsdom + fake-indexeddb), `npm run build`.
