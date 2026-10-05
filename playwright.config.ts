import { defineConfig, devices } from "@playwright/test";
import { E2E_DB } from "./e2e/db-url";

const PORT = 3100;
const URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: { baseURL: URL, trace: "retain-on-failure" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // Seed first and start from an empty build cache so no stale cached data survives between runs.
    command: `DATABASE_URL=${E2E_DB} DATABASE_URL_UNPOOLED=${E2E_DB} pnpm exec prisma migrate deploy >/dev/null && pnpm exec tsx e2e/fixtures.ts && rm -rf .next-e2e && pnpm exec next dev --port ${PORT}`,
    url: URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DB,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-0001",
      BETTER_AUTH_URL: URL,
      NEXT_PUBLIC_SHOP_URL: URL,
      NEXT_PUBLIC_BRAND_NAME: "Campus Eats",
      REVALIDATE_SECRET: "e2e-revalidate-secret-e2e-revalidate-01",
      ORDER_LINK_SECRET: "e2e-link-secret-e2e-link-secret-e2e-0001",
      RESEND_API_KEY: "",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
