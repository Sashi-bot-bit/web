# Deploy: customer site (Vercel)

The Vercel build (`vercel-build` in package.json) applies database migrations and loads the starter data before building,
so this site can go live on its own. Both steps are safe to repeat on every deploy.

## 1. Database
Vercel project → **Storage** → Create Database → **Neon** → connect it to this project.
This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.

## 2. Two secrets (Settings → Environment Variables, Production and Preview)
Generate each value in Terminal and paste it:

| Variable | Generate with |
|---|---|
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `ORDER_LINK_SECRET` | `openssl rand -hex 32` (use the **same value** later in the admin site) |

The site address is detected from Vercel automatically. Set `NEXT_PUBLIC_SHOP_URL` and `BETTER_AUTH_URL` only after adding a custom domain (e.g. `https://order.example.co.uk`).

## 3. Optional now, needed for launch

| Variable | Why |
|---|---|
| `RESEND_API_KEY`, `EMAIL_FROM` | Order confirmations, email verification, password reset. Without them, no emails are sent. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` (16+ characters) | Creates or updates the admin login during the build, ready for the admin site. |
| `REVALIDATE_SECRET` (`openssl rand -hex 32`) | Lets the admin site refresh menus here instantly. Same value in both sites. |

## 4. Deploy
Deployments → **Redeploy** (or push to `main`).

## Region
Keep the Vercel Functions region next to the Neon database region (Neon dashboard → project → region).
If Neon is in **London (aws-eu-west-2)**, set Settings → Functions → Region to **London (lhr1)**.

Note: Vercel’s free Hobby plan is for non-commercial use. Move to Pro before trading publicly.
