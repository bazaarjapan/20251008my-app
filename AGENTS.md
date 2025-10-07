# Repository Guidelines

## Project Structure & Module Organization
The App Router lives in `app/`. Key routes: `app/page.tsx` (public board), `app/announcements/page.tsx` (archive), and `app/admin/announcements/page.tsx` (admin console). API routes reside under `app/api/`, with `/api/announcements` for public reads and `/api/admin/announcements` for authenticated posts. Shared utilities sit in `lib/`, and persisted data is stored as JSON within `data/announcements.json`. Keep static assets in `public/`, configuration at the root (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`), and never edit generated directories like `.next/` or `node_modules/`.

## Build, Test, and Development Commands
- `npm install` — install dependencies; stick with npm to honour `package-lock.json`.
- `npm run dev` — launch the Turbopack dev server on http://localhost:3000 with hot refresh.
- `npm run build` — compile the production bundle; run before release or deployment.
- `npm run start` — serve the production build locally for smoke checks.
- `npm run lint` — run ESLint with the Next.js + TypeScript ruleset. Fix issues before committing.

## Coding Style & Naming Conventions
Use TypeScript with strict settings. Components, pages, and layouts follow PascalCase (`AdminAnnouncementsPage.tsx`); hooks and helpers use camelCase (`getAnnouncements`). Prefer module-relative imports (`@/lib/announcements`). Indent with two spaces, keep JSX concise (<100 characters per line), and group imports by package → internal → styles. Run `npm run lint` after changes instead of hand-tuning formatting.

## Testing Guidelines
A formal test runner is not configured. When adding new features, introduce automated coverage alongside the code (e.g., create `app/<feature>/__tests__/Component.test.tsx`) and wire an `npm run test` script if you adopt Vitest, Jest, or Playwright. Until a harness exists, document manual verification steps (screenshots, commands) in your PR and ensure `npm run start` passes smoke tests.

## Commit & Pull Request Guidelines
Follow short, imperative commit subjects (`Add admin notice form`), ≤72 characters, optional body for context, and reference issues (`Closes #123`). Keep branches rebased on `main`. PRs must outline scope, note schema or env changes, attach UI evidence (e.g., admin form screenshot), and list executed commands. Request at least one review before merging.

## Security & Configuration Tips
Set `ADMIN_TOKEN=<secret>` in an `.env.local` file; the admin API rejects posts without it. Never commit the token or `data/announcements.json` with sensitive entries—scrub before sharing. Back up `data/announcements.json` prior to bulk edits, and prefer scripted migrations over manual JSON edits when transforming stored announcements.
