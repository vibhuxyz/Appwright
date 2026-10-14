import { ArrowRight, Bot, LayoutDashboard, ShoppingBag, BookOpen, Kanban } from "lucide-react";
import type { TemplateItem } from "../data/templatesData";
import { cn } from "@/shared/lib/cn";

function TemplateVisual({ id }: { id: string }) {
  if (id === "saas-starter") {
    return (
      <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-border/50 bg-[#0B0D11] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <LayoutDashboard className="size-3.5 text-emerald-400" />
            <span className="text-[10px] font-medium text-foreground-secondary">Analytics</span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
            +34%
          </span>
        </div>
        <div className="relative h-12 w-full overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-8 rounded-lg bg-linear-to-t from-emerald-500/10 to-transparent" />
          <svg className="size-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path
              d="M0,35 Q20,10 40,25 T70,12 T100,5"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (id === "ai-chat") {
    return (
      <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-border/50 bg-[#0B0D11] p-3">
        <div className="flex items-center gap-1.5">
          <Bot className="size-3.5 text-blue-400" />
          <span className="text-[10px] font-medium text-foreground-secondary">Assistant</span>
        </div>
        <div className="space-y-1.5">
          <div className="max-w-[75%] rounded-lg bg-surface-2 p-1.5 text-[10px] text-muted">
            How can I help you today?
          </div>
          <div className="ml-auto max-w-[65%] rounded-lg bg-blue-500/20 p-1.5 text-[10px] text-blue-200">
            Build a fullstack app!
          </div>
        </div>
      </div>
    );
  }

  if (id === "ecommerce-store") {
    return (
      <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-border/50 bg-[#0B0D11] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-amber-400" />
            <span className="text-[10px] font-medium text-foreground-secondary">Store</span>
          </div>
          <span className="font-mono text-[10px] text-muted">$120</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="h-10 rounded-md bg-surface-2 ring-1 ring-border/40" />
          <div className="h-10 rounded-md bg-surface-2 ring-1 ring-border/40" />
          <div className="h-10 rounded-md bg-surface-2 ring-1 ring-border/40" />
        </div>
      </div>
    );
  }

  if (id === "blog-cms") {
    return (
      <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-border/50 bg-[#0B0D11] p-3">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-purple-400" />
          <span className="text-[10px] font-medium text-foreground-secondary">Editorial</span>
        </div>
        <div className="space-y-1 rounded-lg bg-surface-2/60 p-2">
          <div className="h-2 w-3/4 rounded-full bg-foreground-secondary/40" />
          <div className="h-1.5 w-full rounded-full bg-muted/30" />
          <div className="h-1.5 w-4/5 rounded-full bg-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-border/50 bg-[#0B0D11] p-3">
      <div className="flex items-center gap-1.5">
        <Kanban className="size-3.5 text-rose-400" />
        <span className="text-[10px] font-medium text-foreground-secondary">Sprint Board</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 rounded-md border border-border/40 bg-surface-2/40 p-1.5">
          <div className="h-1.5 w-3/4 rounded-full bg-rose-400/60" />
        </div>
        <div className="h-10 rounded-md border border-border/40 bg-surface-2/40 p-1.5">
          <div className="h-1.5 w-1/2 rounded-full bg-emerald-400/60" />
        </div>
      </div>
    </div>
  );
}

export function TemplateCard({
  template,
  onSelect,
}: {
  template: TemplateItem;
  onSelect: (template: TemplateItem) => void;
}) {
  return (
    <div
      onClick={() => onSelect(template)}
      className="group flex w-72 shrink-0 cursor-pointer flex-col justify-between rounded-2xl border border-border/60 bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-black/50"
    >
      <div>
        <TemplateVisual id={template.id} />
        <h3 className="mt-3.5 text-base font-semibold text-foreground group-hover:text-lime">
          {template.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {template.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-border/60 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-foreground-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className={cn(
          "grid size-7 place-items-center rounded-full border border-border/80 bg-surface-2 text-muted transition-colors group-hover:border-lime group-hover:bg-lime group-hover:text-black"
        )}>
          <ArrowRight className="size-3.5" />
        </div>
      </div>
    </div>
  );
}
