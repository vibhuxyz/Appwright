import type { Metadata } from "next";

interface SiteInfo {
  title: string;
  description: string;
  url: string;
}

export function buildMetadata({ title, description, url }: SiteInfo): Metadata {
  return {
    title,
    description,
    metadataBase: new URL(url),
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}
