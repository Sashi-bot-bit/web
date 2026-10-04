import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/server/catalog";
import { LegalPage, TraderDetails } from "../legal-page";

export const metadata: Metadata = { title: "Terms of sale" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Terms of sale" updated="5 October 2026">
      <h2>Who we are</h2>
      <p>These terms apply when you order food through {s.brandName}. We are:</p>
      <TraderDetails />
      <p>
        We are an independent business. We are not part of, or endorsed by, any university. The restaurants listed are independent businesses that
        prepare the food; we collect it and hand it over to you at a drop point.
      </p>

      <h2>How ordering works</h2>
      <ul>
        <li>You can order only while a delivery slot’s ordering window is open. The cutoff time is shown on the site.</li>
        <li>Your order is confirmed when you see the confirmation page and receive our email. Each slot has limited capacity.</li>
        <li>You collect your order from the drop point you chose, during the delivery window shown on your order.</li>
        <li>Prices include VAT where applicable. Every fee is shown separately before you place your order.</li>
      </ul>

      <h2>Paying</h2>
      <p>You pay when you collect your order. {s.paymentInstructions} Please have the exact total ready where possible.</p>

      <h2>Changing or cancelling</h2>
      <ul>
        <li>You can cancel online, free of charge, until the ordering window for your slot closes.</li>
        <li>After the cutoff we have already placed your order with the restaurant, so it can’t be cancelled online. Contact us if something has gone wrong.</li>
        <li>
          Because food is perishable and made for you, the 14-day cancellation period under the Consumer Contracts Regulations does not apply.
        </li>
        <li>We may cancel an order if a restaurant can’t fulfil it or for reasons outside our control. If we do, nothing is owed.</li>
      </ul>

      <h2>If you don’t collect</h2>
      <p>
        If nobody collects an order during the delivery window, the order is marked as not collected. The food has already been bought from the
        restaurant, so repeated no-shows mean we may stop accepting orders for those contact details. You can contact us to discuss this.
      </p>

      <h2>Allergens</h2>
      <p>
        Allergen information comes from the restaurants and is shown before you order and on your confirmation. Food is prepared in kitchens that handle
        all 14 major allergens, so we can’t guarantee any item is free from traces. Read our <Link href="/legal/allergens">allergen information</Link>.
      </p>

      <h2>Problems with your order</h2>
      <p>
        If something is missing or wrong, tell us as soon as possible through <Link href="/support">Help & contact</Link> or by email. Your statutory
        rights are not affected.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the law of England and Wales.</p>
    </LegalPage>
  );
}
