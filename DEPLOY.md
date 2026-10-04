# Deploy: customer site (Vercel)

Deploy the **admin** repo first (it creates the database tables). Then:

1. Vercel → Add New → Project → import this GitHub repo. Framework: Next.js (auto-detected).
2. Environment variables (Production and Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (same database as admin) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (different from admin) |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_SHOP_URL` | Your Vercel URL, e.g. `https://campus-eats.vercel.app` |
| `NEXT_PUBLIC_BRAND_NAME` | `Campus Eats` (or your brand) |
| `REVALIDATE_SECRET` | Same value as admin |
| `ORDER_LINK_SECRET` | Same value as admin |
| `RESEND_API_KEY`, `EMAIL_FROM` | Needed for confirmation, verification and password emails. Without a key the site works but no emails are sent |

3. Deploy. After changing the domain, update `BETTER_AUTH_URL`/`NEXT_PUBLIC_SHOP_URL` here and `NEXT_PUBLIC_SHOP_URL` in Render.

Note: Vercel’s free Hobby plan is for non-commercial use. Move to Pro before trading publicly.

## Quickest setup (no Render yet)

1. Vercel project → **Storage** → Create Database → **Neon** → connect to this project (adds `DATABASE_URL`).
2. From the `admin` repo on your laptop, create the tables and starter data once (use the Neon connection strings from Vercel → Storage):
   ```bash
   DATABASE_URL="<pooled>" DATABASE_URL_UNPOOLED="<direct>" ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="<16+ chars>" pnpm db:deploy && pnpm db:seed
   ```
3. Add the other variables above, then **Redeploy the latest commit**.
