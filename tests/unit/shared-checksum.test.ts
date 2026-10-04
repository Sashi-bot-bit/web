import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sharedChecksum } from "../../scripts/shared-checksum";

describe("shared contract", () => {
  it("matches the recorded checksum (run `pnpm sync:web` after editing src/shared or the schema)", () => {
    const root = resolve(__dirname, "../..");
    const recorded = readFileSync(resolve(root, "src/shared/SHARED_CHECKSUM"), "utf8").trim();
    expect(sharedChecksum(root)).toBe(recorded);
  });
});
