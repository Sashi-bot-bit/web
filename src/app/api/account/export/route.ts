import { db } from "@/server/db";
import { currentCustomer } from "@/server/session";

/** UK GDPR right of access: everything we hold about the signed-in customer, as JSON. */
export async function GET() {
  const customer = await currentCustomer();
  if (!customer) return Response.json({ error: "Sign in to download your data" }, { status: 401 });
  const [user, orders, favourites, tickets] = await Promise.all([
    db.user.findUnique({
      where: { id: customer.id },
      select: { name: true, email: true, emailVerified: true, phone: true, marketingOptIn: true, marketingOptInAt: true, createdAt: true },
    }),
    db.order.findMany({
      where: { OR: [{ userId: customer.id }, { contactEmail: customer.email.toLowerCase() }] },
      orderBy: { placedAt: "desc" },
      select: {
        number: true,
        status: true,
        placedAt: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        dropPointSnapshot: true,
        subtotalPence: true,
        feesPence: true,
        totalPence: true,
        paymentStatus: true,
        items: { select: { restaurantName: true, name: true, quantity: true, unitPricePence: true, allergens: true } },
        fees: { select: { label: true, chargedPence: true } },
      },
    }),
    db.favourite.findMany({ where: { userId: customer.id }, select: { createdAt: true, menuItem: { select: { name: true } } } }),
    db.supportTicket.findMany({
      where: { OR: [{ userId: customer.id }, { contactEmail: customer.email.toLowerCase() }] },
      select: { number: true, subject: true, status: true, createdAt: true, messages: { select: { authorType: true, body: true, createdAt: true } } },
    }),
  ]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), profile: user, orders, favourites, supportTickets: tickets }, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
