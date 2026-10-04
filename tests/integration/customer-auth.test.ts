import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { afterAll, describe, expect, it, vi } from "vitest";

// Emails are printed in development; keep test output quiet.
vi.spyOn(console, "info").mockImplementation(() => undefined);

const { auth } = await import("@/server/auth");
const { db } = await import("@/server/db");

const PASSWORD = "correct-horse-battery-staple-42";
const emails: string[] = [];
const newEmail = () => {
  const e = `cust-${randomUUID()}@example.test`;
  emails.push(e);
  return e;
};

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { in: emails } } });
  await db.$disconnect();
});

describe("customer auth", () => {
  it("creates CUSTOMER accounts and ignores a role in the sign-up body", async () => {
    const email = newEmail();
    await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name: "Mallory", role: "ADMIN" } as never,
    });
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("CUSTOMER");
    expect(user.emailVerified).toBe(false);
  });

  it("stores marketing consent only when explicitly given", async () => {
    const optedIn = newEmail();
    const notOptedIn = newEmail();
    await auth.api.signUpEmail({ body: { email: optedIn, password: PASSWORD, name: "A", marketingOptIn: true } });
    await auth.api.signUpEmail({ body: { email: notOptedIn, password: PASSWORD, name: "B" } });
    const a = await db.user.findUniqueOrThrow({ where: { email: optedIn } });
    const b = await db.user.findUniqueOrThrow({ where: { email: notOptedIn } });
    expect(a.marketingOptIn).toBe(true);
    expect(a.marketingOptInAt).toBeInstanceOf(Date);
    expect(b.marketingOptIn).toBe(false);
    expect(b.marketingOptInAt).toBeNull();
  });

  it("rejects passwords shorter than 10 characters", async () => {
    await expect(auth.api.signUpEmail({ body: { email: newEmail(), password: "short", name: "C" } })).rejects.toThrow();
  });

  it("does not let an ADMIN account sign in to the shop", async () => {
    const email = newEmail();
    const id = randomUUID();
    await db.user.create({ data: { id, email, name: "Admin", role: "ADMIN", emailVerified: true } });
    await db.account.create({
      data: { id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: await hashPassword(PASSWORD) },
    });
    await expect(auth.api.signInEmail({ body: { email, password: PASSWORD } })).rejects.toThrow();
  });
});
