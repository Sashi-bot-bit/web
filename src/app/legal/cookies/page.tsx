import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Cookie notice" };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie notice" updated="5 October 2026">
      <p>We only use what is strictly necessary for the site to work, so we don’t ask for cookie consent. We don’t use analytics or advertising cookies.</p>
      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Sign-in cookies</strong> (names starting <code>ce.</code>): keep you signed in. Set only when you sign in. Expire after 30 days.
        </li>
        <li>
          <strong>Basket</strong> (browser storage, <code>ce-cart-v1</code>): remembers your basket on this device. It never leaves your browser until you check out.
        </li>
      </ul>
      <p>If we ever add analytics, we’ll ask for your consent first.</p>
    </LegalPage>
  );
}
