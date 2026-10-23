import type { Runtime } from "@repo/agent-core";
import type { Page } from "@repo/contracts";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

const METADATA_HELPER = `import type { Metadata } from "next";

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
`;

const ROBOTS_FILE = `import type { MetadataRoute } from "next";
import { env } from "../env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: \`\${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml\`,
  };
}
`;

function sitemapEntry(route: string): string {
  const path = route === "/" ? "" : route;
  return `    { url: \`\${env.NEXT_PUBLIC_SITE_URL}${path}\`, lastModified: now, changeFrequency: "weekly" as const, priority: ${path ? "0.8" : "1"} },`;
}

function buildSitemapFile(pages: readonly Page[]): string {
  const entries = pages.map((page) => sitemapEntry(page.route)).join("\n");
  return `import type { MetadataRoute } from "next";
import { env } from "../env";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
${entries}
  ];
}
`;
}

export async function generateSeoAttempt(
  task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  const files = [
    { path: "src/seo/metadata.ts", content: METADATA_HELPER },
    { path: "src/app/sitemap.ts", content: buildSitemapFile(task.pages) },
    { path: "src/app/robots.ts", content: ROBOTS_FILE },
  ];

  await Promise.all(files.map((file) => runtime.writeFile(file.path, file.content)));

  return { kind: "completed", costCents: 0, writtenPaths: files.map((file) => file.path) };
}
