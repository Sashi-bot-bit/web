# CLAUDE.md: web repo (customer site)

@AGENTS.md

Customer site for Campus Eats (placeholder brand). Deploys to **Vercel (Hobby)**, region `lhr1`. The admin portal is the separate **admin** repo (`../admin`, Render), which **owns the database schema, migrations and `src/shared/`**. Product and architecture docs: `../admin/docs/`.

## Status (2026-10-05)
All customer features built: home with live ordering countdown and slot/delivery times, restaurant menus (sticky tabs, item sheet with allergens, favourites), basket, pay-on-delivery checkout with atomic capacity, order tracking with polling and cancellation, account (profile, orders + reorder, favourites, password, GDPR export/delete), support threads, legal pages, PWA manifest. Integration tests for order placement (incl. concurrency) and auth; Playwright e2e for guest and registered checkout with axe checks.

## Stack (pinned)
Next.js 16.3.8 with **Cache Components** (`cacheComponents: true`) · React 19.2 · TypeScript strict · Tailwind 4.3 · Prisma 7.10 client (no migrations here) · Better Auth 1.7 · Resend 6 + React Email · Zod 4 · Vitest 5.

## Commands
`pnpm dev` (port 3000) · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` (own DB `campus_eats_e2e`, port 3100; seeds an open slot, so run before 23:50 London) · `pnpm build`

## Rules
- **Never edit `src/shared/` or `prisma/schema.prisma` here.** Change them in admin, run `pnpm sync:web` there, then `pnpm prisma generate` here. `tests/unit/shared-checksum.test.ts` fails on local edits.
- Migrations and seed are **copied from admin** (`prisma/migrations`, `prisma/seed.ts`); never write them here. The Vercel build (`vercel-build`) runs `prisma migrate deploy` + `prisma db seed` (advisory-locked, idempotent) so the site can deploy on its own. Local `pnpm build` does not touch the database schema.
- On Vercel, `NEXT_PUBLIC_SHOP_URL`/`BETTER_AUTH_URL` default to the deployment URL (`src/server/env.ts`); `REVALIDATE_SECRET` is optional (endpoint refuses all calls without it).
- Cached reads live in `src/server/catalog.ts` (`"use cache"` + `cacheLife` + `cacheTag`). Tags: `menu`, `slots`, `settings`, `drop-points`, `fees`, `restaurant:<id>`. Anything reading cookies/headers goes inside `<Suspense>`.
- Auth flows call Better Auth from the browser (`src/lib/auth-client.ts`) so its rate limits and cookies apply; `useClientForm` handles Zod validation and focus.
- Emails: `sendEmail()` in `src/server/email/send.ts` (optional `dedupeKey` → `EmailLog`). Without `RESEND_API_KEY`, outside production only, the email is printed to the server console.

## Key decisions
- D1 Shop sessions only for `role=CUSTOMER` and non-anonymised users (DB hook). `role` is not an accepted sign-up field (covered by an integration test).
- D2 Email verification isn't required to sign in. Verified email is required later to attach guest orders (Phase 2).
- D3 Rate limits (DB-backed): sign-in 5/15 min, sign-up 5/h, reset 3/h, resend verification 3/h. IP from `x-vercel-forwarded-for` / `x-real-ip`.
- D4 Static CSP in `next.config.ts` (no nonce) so pages can prerender; no third-party origins.
- D5 Marketing consent is opt-in, stored with a server-set `marketingOptInAt` timestamp (PECR).
- D6 `placeOrder()` (`src/server/orders/place.ts`): server quote from DB prices → refuse if the total differs from what the customer saw → lock the `SlotOccurrence` row (`INSERT … ON CONFLICT DO NOTHING` then `FOR UPDATE`) → cutoff, capacity, per-restaurant caps, per-contact limit → create order with item/fee/drop-point snapshots. Covered by `tests/integration/place-order.test.ts` (25 concurrent checkouts, 10 places).
- D7 Basket lives in localStorage (`src/lib/cart.ts`, `useSyncExternalStore`); use `useCartReady()` before acting on an empty basket (hydration).
- D8 Order/ticket pages: owner session or HMAC link (`?t=`), 90 days. `findViewableOrder()` is the only access check.
- D9 Account deletion anonymises user, orders and tickets; refused while an order is in progress.

## Design passes
Impeccable + Taste skills were **not available** in the Phase 1 session. Their passes are owed.
