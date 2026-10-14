export interface HeroSlideData {
  id: number;
  tags: string[];
  titlePrefix: string;
  titleHighlight: string;
  highlightClass: string;
  description: string;
  glowColor1: string;
  glowColor2: string;
  activeStage: "IDEAS" | "BUILD" | "DEPLOY" | "SCALE";
}

export const HERO_SLIDES: HeroSlideData[] = [
  {
    id: 0,
    tags: ["BUILD", "DEPLOY", "SCALE"],
    titlePrefix: "Turn your ideas into ",
    titleHighlight: "real products.",
    highlightClass: "text-lime",
    description:
      "Start from a ready-to-use app or create a project from scratch. Deploy, scale and ship faster with Appwright.",
    glowColor1: "bg-rose-600/15",
    glowColor2: "bg-lime/10",
    activeStage: "SCALE",
  },
  {
    id: 1,
    tags: ["AI AGENT", "REASONING", "STREAMING"],
    titlePrefix: "Build with intelligent ",
    titleHighlight: "AI pair-programming.",
    highlightClass: "text-purple-400",
    description:
      "Chat with frontier models to plan features, generate clean code, fix bugs, and preview live in real time.",
    glowColor1: "bg-purple-600/20",
    glowColor2: "bg-pink-500/15",
    activeStage: "BUILD",
  },
  {
    id: 2,
    tags: ["EDGE CDN", "SERVERLESS", "ZERO-CONFIG"],
    titlePrefix: "Ship production apps in ",
    titleHighlight: "minutes, not days.",
    highlightClass: "text-sky-400",
    description:
      "Next.js, Vite, Tailwind CSS, PostgreSQL, Stripe, and authentication — pre-wired, tested and live instantly.",
    glowColor1: "bg-sky-600/20",
    glowColor2: "bg-cyan-500/15",
    activeStage: "DEPLOY",
  },
];
