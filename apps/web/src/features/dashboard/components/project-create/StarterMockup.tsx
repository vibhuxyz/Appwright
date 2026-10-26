import type { StarterTemplate } from "../../data/starterTemplates";

const SAAS_METRICS = ["Revenue", "Customers", "Conversion"] as const;
const SAAS_BAR_HEIGHTS = [35, 58, 44, 76, 52, 88, 67, 96] as const;
const COMMERCE_ITEMS = [
  { name: "New arrivals", color: "bg-white/6" },
  { name: "Featured", color: "bg-amber-400/15" },
  { name: "Popular", color: "bg-white/6" },
] as const;
const BOARD_COLUMNS = [
  { name: "To do", isHighlighted: false },
  { name: "In progress", isHighlighted: true },
  { name: "Done", isHighlighted: false },
] as const;
const BOARD_TASKS = ["Outline", "Review"] as const;

export function StarterMockup({ template }: { template: StarterTemplate }) {
  switch (template.id) {
    case "blank":
      return <BlankMockup />;
    case "saas":
      return <SaasMockup />;
    case "ai-chat":
      return <ChatMockup />;
    case "ecommerce":
      return <CommerceMockup />;
    case "blog-cms":
      return <BlogMockup />;
    case "pm":
      return <ProjectMockup />;
  }
}

function BlankMockup() {
  return (
    <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-white/15 bg-white/2">
      <div className="text-center"><span className="text-2xl text-lime">＋</span><p className="mt-2 text-xs text-muted">Start with a blank canvas</p></div>
    </div>
  );
}

function SaasMockup() {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#12151a] p-4">
      <div className="flex justify-between"><span className="text-xs font-semibold text-white">Overview</span><span className="text-[10px] text-emerald-300">+18.6%</span></div>
      <div className="grid grid-cols-3 gap-2">{SAAS_METRICS.map((item) => <span key={item} className="rounded-lg bg-white/4 p-2"><span className="block text-[9px] text-muted">{item}</span><span className="mt-2 block h-2 w-3/4 rounded bg-white/20" /></span>)}</div>
      <div className="flex h-24 items-end gap-2 rounded-lg bg-emerald-400/4 p-3">{SAAS_BAR_HEIGHTS.map((height) => <span key={height} style={{ height: `${height}%` }} className="flex-1 rounded-t bg-emerald-400/50" />)}</div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="mx-auto flex min-h-52 max-w-md flex-col justify-between rounded-xl border border-white/10 bg-[#12151a] p-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3"><span className="size-6 rounded-full bg-blue-400/20" /><span className="text-xs text-white">AI Assistant</span></div>
      <div className="space-y-3 py-4"><p className="w-fit rounded-xl bg-white/6 px-3 py-2 text-[10px] text-muted">What are you working on?</p><p className="ml-auto w-fit rounded-xl bg-blue-500/20 px-3 py-2 text-[10px] text-blue-100">Help me plan my next project.</p><p className="w-3/4 rounded-xl bg-white/6 px-3 py-2 text-[10px] text-muted">Let’s break it into a few clear steps.</p></div>
      <div className="h-8 rounded-lg border border-white/10 bg-white/3" />
    </div>
  );
}

function CommerceMockup() {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#12151a] p-4">
      <div className="flex items-center justify-between"><span className="text-xs font-bold text-white">Storefront</span><span className="rounded-md bg-lime px-2 py-1 text-[9px] font-semibold text-black">Shop now</span></div>
      <div className="grid grid-cols-3 gap-2">{COMMERCE_ITEMS.map((item) => <div key={item.name} className="rounded-lg bg-white/4 p-2"><span className={`mb-2 block h-16 rounded-md ${item.color}`} /><span className="block truncate text-[9px] text-muted">{item.name}</span><span className="mt-1 block h-1.5 w-1/2 rounded bg-white/20" /></div>)}</div>
    </div>
  );
}

function BlogMockup() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12151a] p-4">
      <div className="mb-4 flex justify-between border-b border-white/5 pb-3"><span className="text-xs font-bold text-white">The Daily Edit</span><span className="text-[9px] text-purple-300">Stories</span></div>
      <div className="grid grid-cols-[1.2fr_1fr] gap-3"><span className="min-h-28 rounded-lg bg-linear-to-br from-purple-400/20 to-rose-400/10" /><div className="flex flex-col justify-center"><span className="text-[9px] text-purple-300">FEATURED STORY</span><span className="mt-2 text-sm leading-tight font-semibold text-white">Ideas worth sharing</span><span className="mt-2 block h-1.5 w-full rounded bg-white/10" /><span className="mt-1 block h-1.5 w-3/4 rounded bg-white/10" /></div></div>
    </div>
  );
}

function ProjectMockup() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#12151a] p-4">
      {BOARD_COLUMNS.map((column) => <div key={column.name} className="rounded-lg bg-white/3 p-2"><span className="mb-3 block text-[9px] text-muted">{column.name}</span>{BOARD_TASKS.map((task) => <span key={task} className={`mb-2 block h-12 rounded-md border border-white/5 ${column.isHighlighted ? "bg-blue-400/6" : "bg-white/3"} p-1.5`}><span className="block h-1.5 w-3/4 rounded bg-white/20" /><span className="mt-2 block size-3 rounded-full bg-rose-300/40" /></span>)}</div>)}
    </div>
  );
}
