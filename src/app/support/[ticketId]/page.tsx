import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { formatLondonDateTime } from "@/shared/time";
import { findViewableTicket } from "@/server/support";
import { orderPath } from "@/server/links";
import { cn } from "@/components/ui/cn";
import { Chip } from "@/components/ui/chip";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Conversation", robots: { index: false, follow: false } };

type Props = { params: Promise<{ ticketId: string }>; searchParams: Promise<{ t?: string }> };

async function Thread({ params, searchParams }: Props) {
  await connection();
  const [{ ticketId }, { t }] = await Promise.all([params, searchParams]);
  const ticket = await findViewableTicket(ticketId, t);
  if (!ticket) notFound();
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-small text-muted">{ticket.number}</p>
          <h1 className="text-h1 font-bold">{ticket.subject}</h1>
          {ticket.order ? (
            <Link href={orderPath(ticket.order.id)} className="mt-1 inline-block text-small font-bold underline underline-offset-4">
              About order {ticket.order.number}
            </Link>
          ) : null}
        </div>
        {ticket.status === "OPEN" ? <Chip tone="info">Open</Chip> : <Chip tone="outline">Resolved</Chip>}
      </div>
      <ol className="mt-8 space-y-4">
        {ticket.messages.map((m) => {
          const mine = m.authorType === "CUSTOMER";
          return (
            <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-[var(--radius-lg)] px-4 py-3", mine ? "bg-surface" : "bg-ink text-on-dark")}>
                <p className={cn("text-[0.8125rem] font-bold", mine ? "text-muted" : "text-on-dark-muted")}>
                  {mine ? "You" : "Support"} · {formatLondonDateTime(m.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-8 border-t border-border pt-6">
        <ReplyForm ticketId={ticket.id} token={t ?? null} resolved={ticket.status === "RESOLVED"} />
      </div>
    </>
  );
}

export default function TicketPage(props: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <Link href="/support" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-small font-bold text-ink-2 hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" /> Help & contact
      </Link>
      <Suspense fallback={<div className="mt-4 h-64 animate-pulse rounded-[var(--radius-lg)] bg-surface" />}>
        <Thread {...props} />
      </Suspense>
    </div>
  );
}
