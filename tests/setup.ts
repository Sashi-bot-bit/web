import { config } from "dotenv";

// Integration tests use the dedicated test database, never the dev one.
config({ path: ".env.test", override: true });
config({ path: ".env" });
