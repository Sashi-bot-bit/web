import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";

export type Customer = { id: string; name: string; email: string; emailVerified: boolean };

/** The signed-in customer for this request, or null. */
export const currentCustomer = cache(async (): Promise<Customer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, emailVerified } = session.user;
  return { id, name, email, emailVerified };
});
