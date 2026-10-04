import { Button, Column, Heading, Link, Row, Section, Text } from "@react-email/components";
import { formatPence } from "../money";
import { EmailLayout, emailStyles } from "./layout";

export type OrderEmailData = {
  brand: string;
  number: string;
  customerName: string;
  slotName: string;
  /** e.g. "Tue 6 Oct, 12:45–13:15" */
  deliveryWindow: string;
  dropPoint: { name: string; description: string; directions: string | null; mapUrl: string | null };
  restaurants: { name: string; items: { name: string; quantity: number; lineTotalPence: number; allergens: string[]; mayContain: string[] }[] }[];
  fees: { label: string; chargedPence: number }[];
  subtotalPence: number;
  totalPence: number;
  paymentInstructions: string;
  trackUrl: string;
  supportEmail: string | null;
};

function Totals({ order }: { order: OrderEmailData }) {
  const line = (label: string, value: string, bold = false) => (
    <Row>
      <Column style={{ ...emailStyles.row, fontWeight: bold ? 700 : 400 }}>{label}</Column>
      <Column style={{ ...emailStyles.row, fontWeight: bold ? 700 : 400, textAlign: "right" }}>{value}</Column>
    </Row>
  );
  return (
    <Section style={emailStyles.box}>
      {line("Items", formatPence(order.subtotalPence))}
      {order.fees.map((f) => line(f.label, formatPence(f.chargedPence)))}
      {line("Total to pay on delivery", formatPence(order.totalPence), true)}
    </Section>
  );
}

function Items({ order }: { order: OrderEmailData }) {
  return (
    <>
      {order.restaurants.map((r) => (
        <Section key={r.name}>
          <Text style={emailStyles.h2}>{r.name}</Text>
          {r.items.map((i, idx) => (
            <Section key={`${i.name}-${idx}`} style={{ margin: "0 0 10px" }}>
              <Row>
                <Column style={emailStyles.row}>
                  {i.quantity} × {i.name}
                </Column>
                <Column style={{ ...emailStyles.row, textAlign: "right" }}>{formatPence(i.lineTotalPence)}</Column>
              </Row>
              <Text style={emailStyles.small}>
                Contains: {i.allergens.length ? i.allergens.join(", ") : "none of the 14 allergens"}
                {i.mayContain.length ? ` · May contain: ${i.mayContain.join(", ")}` : ""}
              </Text>
            </Section>
          ))}
        </Section>
      ))}
    </>
  );
}

function DropPoint({ order }: { order: OrderEmailData }) {
  return (
    <Section style={emailStyles.box}>
      <Text style={{ ...emailStyles.row, fontWeight: 700 }}>{order.dropPoint.name}</Text>
      <Text style={emailStyles.small}>{order.dropPoint.description}</Text>
      {order.dropPoint.directions ? <Text style={emailStyles.small}>{order.dropPoint.directions}</Text> : null}
      {order.dropPoint.mapUrl ? (
        <Link href={order.dropPoint.mapUrl} style={{ ...emailStyles.small, color: "#6b2a99", textDecoration: "underline" }}>
          Open in maps
        </Link>
      ) : null}
    </Section>
  );
}

export function OrderConfirmationEmail({ order }: { order: OrderEmailData }) {
  return (
    <EmailLayout brand={order.brand} preview={`Order ${order.number} confirmed: ${order.slotName}, ${order.deliveryWindow}`} footer={`Questions? Reply to ${order.supportEmail ?? "us"} quoting order ${order.number}.`}>
      <Heading as="h1" style={emailStyles.h1}>
        Order {order.number} is confirmed
      </Heading>
      <Text style={emailStyles.text}>
        Thanks, {order.customerName}. Collect it from <strong>{order.dropPoint.name}</strong> between <strong>{order.deliveryWindow}</strong>.
      </Text>
      <Text style={emailStyles.text}>
        <strong>Pay {formatPence(order.totalPence)} on delivery.</strong> {order.paymentInstructions}
      </Text>
      <Button href={order.trackUrl} style={emailStyles.button}>
        Track your order
      </Button>
      <Text style={emailStyles.h2}>Drop point</Text>
      <DropPoint order={order} />
      <Items order={order} />
      <Totals order={order} />
      <Text style={emailStyles.muted}>
        Allergy or intolerance? Allergen information comes from the restaurants. If you have a serious allergy, contact us before your order is prepared.
      </Text>
    </EmailLayout>
  );
}

export type StatusEmailKind = "PREPARING" | "IN_TRANSIT" | "DELIVERED";

const STATUS_COPY: Record<StatusEmailKind, { subject: (n: string) => string; heading: string; body: (o: OrderEmailData) => string }> = {
  PREPARING: {
    subject: (n) => `Order ${n} is being prepared`,
    heading: "Your order is being prepared",
    body: (o) => `The restaurant is preparing your food. We’ll bring it to ${o.dropPoint.name} between ${o.deliveryWindow}.`,
  },
  IN_TRANSIT: {
    subject: (n) => `Order ${n} is on the way`,
    heading: "Your order is on the way",
    body: (o) => `Head to ${o.dropPoint.name} for ${o.deliveryWindow}. Have ${formatPence(o.totalPence)} ready to pay on collection.`,
  },
  DELIVERED: {
    subject: (n) => `Order ${n} delivered`,
    heading: "Enjoy your meal",
    body: () => "Your order has been handed over. Thanks for ordering with us.",
  },
};

export function orderStatusSubject(kind: StatusEmailKind, number: string) {
  return STATUS_COPY[kind].subject(number);
}

export function OrderStatusEmail({ order, kind }: { order: OrderEmailData; kind: StatusEmailKind }) {
  const copy = STATUS_COPY[kind];
  return (
    <EmailLayout brand={order.brand} preview={copy.subject(order.number)}>
      <Heading as="h1" style={emailStyles.h1}>
        {copy.heading}
      </Heading>
      <Text style={emailStyles.text}>{copy.body(order)}</Text>
      {kind !== "DELIVERED" ? <DropPoint order={order} /> : null}
      <Button href={order.trackUrl} style={emailStyles.button}>
        View order {order.number}
      </Button>
    </EmailLayout>
  );
}

export function OrderCancelledEmail({ order, reason, byCustomer }: { order: OrderEmailData; reason: string | null; byCustomer: boolean }) {
  return (
    <EmailLayout brand={order.brand} preview={`Order ${order.number} cancelled`}>
      <Heading as="h1" style={emailStyles.h1}>
        Order {order.number} is cancelled
      </Heading>
      <Text style={emailStyles.text}>
        {byCustomer ? "You cancelled this order. Nothing is owed." : "We’re sorry, we had to cancel this order. Nothing is owed."}
      </Text>
      {reason && !byCustomer ? <Text style={emailStyles.text}>Reason: {reason}</Text> : null}
      <Button href={order.trackUrl} style={emailStyles.button}>
        View order
      </Button>
    </EmailLayout>
  );
}
