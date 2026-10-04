import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireCustomerPage } from "@/server/require-customer";
import { buttonClass } from "@/components/ui/button";
import { DeleteAccount } from "./delete-account";

export const metadata: Metadata = { title: "Privacy", robots: { index: false } };

export default async function PrivacyPage() {
  await requireCustomerPage("/account/privacy");
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-h2 font-bold">Download your data</h2>
        <p className="mt-1 text-small text-muted">
          A copy of your profile, orders, favourites and support messages, as a JSON file. See our{" "}
          <Link href="/legal/privacy" className="font-bold text-ink underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
        {/* A plain link: the browser downloads the file. */}
        <a href="/api/account/export" className={buttonClass("secondary", "md", "mt-4")}>
          <Download aria-hidden className="size-4" /> Download my data
        </a>
      </section>
      <section>
        <h2 className="text-h2 font-bold">Delete your account</h2>
        <p className="mt-1 text-small text-muted">
          We’ll remove your name, email, phone number, password and favourites. Records of past orders are kept without your contact details, because
          we’re required to keep sales records.
        </p>
        <DeleteAccount />
      </section>
    </div>
  );
}
