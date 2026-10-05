import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations and seed are owned by the admin repo and copied here by `pnpm sync:web`.
// On Vercel, `vercel-build` applies them before building (advisory-locked, idempotent),
// so the customer site works without the admin site being deployed first.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
