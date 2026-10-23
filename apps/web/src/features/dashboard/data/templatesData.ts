export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  templateId: "vite-react" | "nextjs-fullstack";
  color: string;
  accent: string;
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: "saas-starter",
    name: "SaaS Starter",
    description: "A complete SaaS boilerplate with auth, billing and dashboard.",
    tags: ["Next.js", "MongoDB", "Stripe"],
    templateId: "nextjs-fullstack",
    color: "from-emerald-500/20 via-cyan-500/10 to-transparent",
    accent: "text-emerald-400",
  },
  {
    id: "ai-chat",
    name: "AI Chat App",
    description: "Full-featured AI chat application with user accounts and usage tracking.",
    tags: ["Next.js", "OpenAI", "MongoDB"],
    templateId: "nextjs-fullstack",
    color: "from-blue-500/20 via-indigo-500/10 to-transparent",
    accent: "text-blue-400",
  },
  {
    id: "ecommerce-store",
    name: "Ecommerce Store",
    description: "Modern eCommerce store with payments, orders and admin panel.",
    tags: ["Next.js", "Stripe", "MongoDB"],
    templateId: "nextjs-fullstack",
    color: "from-amber-500/20 via-orange-500/10 to-transparent",
    accent: "text-amber-400",
  },
  {
    id: "blog-cms",
    name: "Blog / CMS",
    description: "Content-focused blog with a powerful CMS and SEO optimizations.",
    tags: ["Next.js", "MongoDB", "MDX"],
    templateId: "nextjs-fullstack",
    color: "from-purple-500/20 via-pink-500/10 to-transparent",
    accent: "text-purple-400",
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Collaborative project management app with teams and real-time updates.",
    tags: ["Next.js", "MongoDB", "Socket.io"],
    templateId: "nextjs-fullstack",
    color: "from-rose-500/20 via-red-500/10 to-transparent",
    accent: "text-rose-400",
  },
];
