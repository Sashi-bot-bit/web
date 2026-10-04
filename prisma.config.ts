import "dotenv/config";
import { defineConfig } from "prisma/config";

// The web repo never runs migrations: the admin repo owns the schema and
// migrations. This config exists so `prisma generate` can build the client.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
