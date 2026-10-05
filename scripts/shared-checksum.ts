import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Files that make up the shared contract between the admin and web repos. */
export function sharedFiles(root: string): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  return [
    join(root, "prisma/schema.prisma"),
    join(root, "prisma/seed.ts"),
    ...walk(join(root, "prisma/migrations")),
    ...walk(join(root, "src/shared")).filter((f) => !f.endsWith("SHARED_CHECKSUM")),
  ].sort();
}

export function sharedChecksum(root: string): string {
  const hash = createHash("sha256");
  for (const file of sharedFiles(root)) {
    hash.update(relative(root, file));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}
