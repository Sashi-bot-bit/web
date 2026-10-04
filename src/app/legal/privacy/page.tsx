import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/catalog";
import { LegalPage, TraderDetails } from "../legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function PrivacyPolicyPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Privacy policy" updated="5 October 2026">
      <p>This policy explains how {s.brandName} uses your personal data. The data controller is:</p>
      <TraderDetails />

      <h2>What we collect</h2>
      <ul>
        <li>Contact details: your name, email address and UK mobile number.</li>
        <li>Account details, if you create an account: a securely hashed password and your marketing preference.</li>
        <li>Orders: what you ordered, your delivery slot, drop point, totals and payment status.</li>
        <li>Messages you send us through Help & contact.</li>
        <li>Technical data needed for security, such as IP address (to prevent abuse and limit repeated sign-in attempts).</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To take, prepare, deliver and support your order (performance of a contract).</li>
        <li>To keep sales records (legal obligation).</li>
        <li>To keep the service secure and prevent repeated no-shows (legitimate interests).</li>
        <li>To send offers, only if you opted in (consent, which you can withdraw at any time in your account).</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        Restaurants receive only the items in your order. We use service providers to run the site: Vercel and Render (hosting), Neon (database), and
        Resend (email). They process data on our instructions. We don’t sell your data.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Order and sales records: 6 years, as required for tax purposes. If you delete your account, these records are kept without your contact details.</li>
        <li>Account data: until you delete your account.</li>
        <li>Support messages: up to 2 years after the conversation ends.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can access, correct, download or delete your data. Signed-in customers can download their data and delete their account from{" "}
        <Link href="/account/privacy">Account → Privacy</Link>. For anything else, contact us. You can also complain to the Information Commissioner’s
        Office (ico.org.uk).
      </p>

      <h2>Cookies</h2>
      <p>
        We only use cookies that are essential to run the site. See our <Link href="/legal/cookies">cookie notice</Link>.
      </p>
    </LegalPage>
  );
}
