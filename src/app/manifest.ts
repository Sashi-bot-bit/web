import type { MetadataRoute } from "next";
import { getSettings } from "@/server/catalog";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { brandName } = await getSettings();
  return {
    name: brandName,
    short_name: brandName,
    description: "Order from local Hatfield restaurants and collect at a drop point near campus.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
