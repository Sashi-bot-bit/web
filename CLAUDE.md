# CLAUDE.md: web repo (customer site)

@AGENTS.md

Customer site for Campus Eats (placeholder brand). Deploys to **Vercel (Hobby)**, region `lhr1`. The admin portal is the separate **admin** repo (`../admin`, Render), which **owns the database schema, migrations and `src/shared/`**. Product and architecture docs: `../admin/docs/`.

## Status
- **Phase 1: built 2026-10-05, awaiting sign-off.** Customer auth (sign up, sign in, email verification, forgotten/reset password, account page with resend verification and sign out), cached restaurant list on the home page, `/api/revalidate` for the admin site, transactional email plumbing.
- Next: Phase 2 (home slot banner + countdown, menus, item sheet, cart, checkout with COD order placement, tracking, account history/favourites).

## Stack (pinned)
Next.js 16.3.8 with **Cache Components** (`cacheComponents: true`) · React 19.2 · TypeScript strict · Tailwind 4.3 · Prisma 7.10 client (no migrations here) · Better Auth 1.7 · Resend 6 + React Email · Zod 4 · Vitest 5.

## Commands
`pnpm dev` (port 3000) · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (production build needs `RESEND_API_KEY`; use any dummy value for a local check).

## Rules
- **Never edit `src/shared/` or `prisma/schema.prisma` here.** Change them in admin, run `pnpm sync:web` there, then `pnpm prisma generate` here. `tests/unit/shared-checksum.test.ts` fails on local edits.
- Never run migrations from this repo.
- Cached reads live in `src/server/catalog.ts` (`"use cache"` + `cacheLife` + `cacheTag`). Tags: `menu`, `slots`, `settings`, `drop-points`, `fees`, `restaurant:<id>`. Anything reading cookies/headers goes inside `<Suspense>`.
- Auth flows call Better Auth from the browser (`src/lib/auth-client.ts`) so its rate limits and cookies apply; `useClientForm` handles Zod validation and focus.
- Emails: `sendEmail()` in `src/server/email/send.ts` (optional `dedupeKey` → `EmailLog`). Without `RESEND_API_KEY`, outside production only, the email is printed to the server console.

## Key decisions
- D1 Shop sessions only for `role=CUSTOMER` and non-anonymised users (DB hook). `role` is not an accepted sign-up field (covered by an integration test).
- D2 Email verification isn't required to sign in. Verified email is required later to attach guest orders (Phase 2).
- D3 Rate limits (DB-backed): sign-in 5/15 min, sign-up 5/h, reset 3/h, resend verification 3/h. IP from `x-vercel-forwarded-for` / `x-real-ip`.
- D4 Static CSP in `next.config.ts` (no nonce) so pages can prerender; no third-party origins.
- D5 Marketing consent is opt-in, stored with a server-set `marketingOptInAt` timestamp (PECR).

## Design passes
Impeccable + Taste skills were **not available** in the Phase 1 session. Their passes are owed.
