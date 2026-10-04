import type { Metadata } from "next";
import Link from "next/link";
import { ALLERGENS } from "@/shared/allergens";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = { title: "Allergen information" };

export default function AllergensPage() {
  return (
    <LegalPage title="Allergen information" updated="5 October 2026">
      <p>
        Every dish shows which of the 14 major allergens it contains, and any “may contain” warnings, before you order. The same information is on your
        order confirmation email and your order page.
      </p>
      <h2>The 14 major allergens</h2>
      <ul>
        {ALLERGENS.map((a) => (
          <li key={a.code}>{a.label}</li>
        ))}
      </ul>
      <h2>Where the information comes from</h2>
      <p>
        Allergen information is supplied by each restaurant and checked by us before a dish can be ordered. Recipes and suppliers can change, and kitchens
        handle many allergens, so cross-contamination is always possible.
      </p>
      <h2>If you have a severe allergy</h2>
      <p>
        Please <Link href="/support">contact us</Link> before ordering. We can check with the restaurant, but we can’t guarantee any dish is completely free
        from an allergen. We don’t accept special requests to remove ingredients, because we can’t confirm the restaurant has followed them.
      </p>
    </LegalPage>
  );
}
