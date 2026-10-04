import type { Metadata, Viewport } from "next";
import { CartBar } from "@/components/shop/cart-bar";
import { SiteFooter } from "@/components/shop/site-footer";
import { SiteHeader } from "@/components/shop/site-header";
import { getSettings } from "@/server/catalog";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { brandName } = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000"),
    title: { default: `${brandName}: Hatfield food, delivered to your drop point`, template: `%s · ${brandName}` },
    description: "Order lunch or dinner from local Hatfield restaurants before the cutoff, then collect at a drop point near campus. Pay on collection.",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: brandName, statusBarStyle: "default" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { brandName, supportEmail } = await getSettings();
  return (
    <html lang="en-GB">
      <body className="flex min-h-dvh flex-col bg-bg text-ink">
        <a
          href="#main"
          className="sr-only z-50 rounded-[var(--radius-sm)] bg-accent px-4 py-2 font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <SiteHeader brand={brandName} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter brand={brandName} supportEmail={supportEmail} />
        <CartBar />
      </body>
    </html>
  );
}
