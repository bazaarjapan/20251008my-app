# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js App Router. Key routes: `page.tsx` (public board), `announcements/page.tsx` (archive), `admin/announcements/page.tsx` (admin console). API handlers live under `app/api/**`.
- `lib/` — Shared utilities, including announcement persistence (`lib/announcements.ts`) and admin token checks (`lib/admin-auth.ts`).
- `data/` — Local JSON fallback storage (`announcements.json`) used when Vercel KV is unavailable; treat it as dev-only.
- `assets/` — Reference images for docs. Do not bundle them at runtime.
- Config roots: `package.json`, `vercel.json`, `tsconfig.json`, `eslint.config.mjs`.

## Build, Test, and Development Commands
- `npm install` — Resolve dependencies; prefer npm to keep `package-lock.json` authoritative.
- `npm run dev` — Start the local dev server at http://localhost:3000.
- `npm run build` — Production build; used by Vercel.
- `npm run start` — Serve the production bundle locally for smoke tests.
- `npm run lint` — ESLint with Next.js/TypeScript rules.

## Coding Style & Naming Conventions
- TypeScript + JSX with strict settings; 2-space indentation.
- Components/pages: PascalCase (`AdminAnnouncementsPage`), hooks/utilities: camelCase (`getAnnouncements`).
- Keep lines ≤ 100 chars where reasonable; prefer module-relative imports (`@/lib/...`).
- Let ESLint and TypeScript drive formatting fixes—avoid manual stylistic churn.

## Testing Guidelines
- No automated test runner is wired yet. When adding tooling (e.g., Vitest, Playwright), colocate specs under `__tests__/` with `.test.tsx` suffix and expose an `npm run test` script.
- Until then, document manual verification (commands run, UI captures) in PRs and exercise `npm run lint` plus `npm run build`.

## Commit & Pull Request Guidelines
- Follow imperative summaries ≤72 chars (`Add KV storage fallback`). Expand context in the body if needed.
- Ensure the branch is rebased on `main` before opening a PR.
- PRs should include: scope summary, linked issues (`Closes #123`), screenshots or clips for UI changes, test evidence, and migration/env notes.
- Request review once checks pass; respond to feedback promptly and keep conversation threads resolved.

## Deployment & Security Notes
- Vercel deploys require `ADMIN_TOKEN` plus Vercel KV credentials (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`). Configure them per environment; never commit secrets.
- In local dev, `.env.local` should define `ADMIN_TOKEN`. For Vercel, set vars via dashboard.
- Treat `data/announcements.json` as non-sensitive and remove before publishing public datasets.
