# CLAUDE.md

## What this is

כותרים: a personal iPhone PWA recording every anime, series, movie, book, game and comic its owner has finished or stopped. Hebrew, RTL. All entries live in IndexedDB on the device, with a JSON backup file. Search goes through a small Cloudflare Worker in `worker/`, which holds the API keys.

## Commands

- `npm run dev`: Vite at `http://localhost:5173/finished-titles/`. The app uses a hash router. Run Vite directly on 5173 to use the Worker locally, as it only allows that local origin.
- `npm test`: the app's Vitest suite. One file: `npx vitest run test/unit/entries.test.ts`.
- `npm run lint`: oxlint.
- `npm run build`: `tsc -b && vite build`. This is the type check.
- In `worker/`: `npm test`, `npx tsc --noEmit`, `npm run dev`, `npx wrangler deploy`.
- A push to `main` that changes `worker/` deploys the Worker through `.github/workflows/worker.yml` (spec 56). Run `npx wrangler deploy` by hand only to deploy outside that workflow.

The app reads the Worker's address from `VITE_SEARCH_URL`, kept in `.env.production` (builds) and `.env.development` (`npm run dev`). Commit both files: GitHub Pages builds from the repo, so an uncommitted address never reaches the phone. Without it, search reports itself as unavailable and manual entry still works.

## Sources of truth

- `docs/specs/2026-11-07-finished-titles-design.md`: numbered decisions. Add new behaviour there as a new numbered decision.
- `PRODUCT.md`: product principles.
- `DESIGN.md` and `.impeccable/`: the visual system, "Soft and light".

## Architecture

Imports go downward only: `pages` → `data` / `domain` / `search` → `copy`. The one exception is that `copy` may import types from `domain`, which has no runtime effect.

- `src/domain/`: pure functions over `Entry[]`, with no React or Dexie.
- `src/data/`: the Dexie database, the repo and backup. Writes go through `repo.ts`, which runs `normalizeEntry`. New `Entry` fields must be optional so old backups still import.
- `src/search/client.ts`: calls the Worker and validates its response.
- `src/pages/<feature>/`: one folder per screen, each with its own `copy.ts` and CSS. `pages/entry/useEntrySheet.tsx` owns the add and edit sheet.

## Tests

- `test/unit` covers logic and data. `test/ui` renders screens with `renderAt(path)`.
- Storage isn't mocked: `fake-indexeddb` backs the real Dexie database. Call `resetDb` in `beforeEach`.
- `test/helpers/searchService.ts` stubs the search service, and `freezeDate` pins "today".
- jsdom has no layout, so check CSS changes in a browser.
