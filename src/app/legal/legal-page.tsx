import type { ReactNode } from "react";
import { getSettings } from "@/server/catalog";

export async function TraderDetails() {
  const s = await getSettings();
  return (
    <address className="not-italic">
      <strong>{s.legalName ?? s.brandName}</strong>
      {s.legalAddress ? (
        <>
          <br />
          {s.legalAddress}
        </>
      ) : null}
      {s.companyNumber ? (
        <>
          <br />
          Company number {s.companyNumber}
        </>
      ) : null}
      {s.supportEmail ? (
        <>
          <br />
          Email: <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>
        </>
      ) : null}
    </address>
  );
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="text-h1 font-bold">{title}</h1>
      <p className="mt-1 text-small text-muted">Last updated {updated}</p>
      <div className="legal mt-8 space-y-4 [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-h2 [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}
