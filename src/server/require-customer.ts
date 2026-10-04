import "server-only";
import { redirect } from "next/navigation";
import { attachGuestOrders } from "./orders/access";
import { currentCustomer, type Customer } from "./session";

/** For account pages: redirect to sign-in, and link verified guest orders. */
export async function requireCustomerPage(next: string): Promise<Customer> {
  const customer = await currentCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(next)}`);
  await attachGuestOrders(customer);
  return customer;
}
