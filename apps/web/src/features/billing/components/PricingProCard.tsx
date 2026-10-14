import { Check, ChevronRight, Info, Sparkles, Terminal } from "lucide-react";
import { FlagshipModelsBox } from "./SeedanceModelsBox";

export function PricingProCard({
  isAnnual,
  proCredits,
  setProCredits,
  isLoading,
  onSelect,
}: {
  isAnnual: boolean;
  proCredits: number;
  setProCredits: (val: number) => void;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const estimatedApps = Math.max(15, Math.round(proCredits * 0.5));

  return (
    <div className="relative flex flex-col rounded-3xl border border-[#2B3824] bg-linear-to-b from-[#182316] via-[#121910] to-[#0F140D] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl font-black tracking-tight text-white">PRO</span>
        <span className="rounded-full bg-[#FF2A6D] px-2.5 py-0.5 text-[11px] font-bold text-white">
          31% OFF
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground-secondary">
        For developers & creators building fullstack web apps
      </p>

      {/* Credits Box with Slider */}
      <div className="mt-4 rounded-2xl border border-[#283521] bg-[#131B11] p-4">
        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
          <Sparkles className="size-4 text-[#E3FC18]" />
          <span>${proCredits.toFixed(2)} monthly building balance</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted">
          = ~ {estimatedApps} Fullstack Next.js & React Apps
        </p>

        {/* Slider */}
        <div className="mt-3">
          <input
            type="range"
            min="50"
            max="100"
            step="25"
            value={proCredits}
            onChange={(e) => setProCredits(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#273320] accent-[#E3FC18]"
          />
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-muted">
            <button
              type="button"
              onClick={() => setProCredits(50)}
              className={`cursor-pointer ${proCredits === 50 ? "font-bold text-white" : ""}`}
            >
              🪙 $50
            </button>
            <button
              type="button"
              onClick={() => setProCredits(75)}
              className={`cursor-pointer ${proCredits === 75 ? "font-bold text-white" : ""}`}
            >
              🪙 $75
            </button>
            <button
              type="button"
              onClick={() => setProCredits(100)}
              className={`cursor-pointer ${proCredits === 100 ? "font-bold text-white" : ""}`}
            >
              🪙 $100
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mt-5 flex items-baseline gap-2">
        {isAnnual && (
          <span className="text-xl font-bold text-[#FF2A6D] line-through">
            $29
          </span>
        )}
        <span className="text-3xl font-black text-white sm:text-4xl">
          {isAnnual ? "$20" : "$29"}
        </span>
        <span className="text-xs text-muted">
          {isAnnual ? "per month, billed annually" : "per month, billed monthly"}
        </span>
      </div>

      {/* Select Offer CTA Button (Lime) */}
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className="mt-4 w-full cursor-pointer rounded-xl bg-[#E3FC18] py-3.5 text-center text-sm font-bold text-black shadow-lg shadow-[#E3FC18]/15 transition-all hover:bg-[#D3EB12] active:scale-98 disabled:opacity-50"
      >
        {isLoading ? "Processing…" : "Select Offer"}
      </button>

      <p className="mt-2 text-center text-[11px] font-medium text-muted">
        {isAnnual ? "Save $108 compared to monthly" : "Flexible monthly billing"}
      </p>

      {/* Unlimited Dev Sandboxes Accordion Card */}
      <div className="mt-4 rounded-xl border border-[#252830] bg-[#14161A] p-3 text-xs">
        <div className="flex items-center justify-between font-bold text-foreground">
          <div className="flex items-center gap-1.5">
            <Terminal className="size-3.5 text-lime" />
            <span className="tracking-wide uppercase">Unlimited Dev Sandboxes</span>
          </div>
          <Info className="size-3.5 cursor-pointer text-muted" />
        </div>
        <div className="mt-2 flex items-center justify-between font-medium text-[#E3FC18]">
          <span>+ Next.js 15, Vite React, Tailwind v4 & Node</span>
          <ChevronRight className="size-3.5" />
        </div>
      </div>

      {/* AI Coding Models Box */}
      <FlagshipModelsBox tier="pro" />

      {/* Features Checklist */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>Full autonomous AI coding agent loop</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span className="border-b border-dotted border-muted/70">
            Unlimited parallel agent background runs
          </span>
          <span className="rounded-full bg-[#FF2A6D] px-1.5 py-0.5 text-[9px] font-bold text-white">
            New
          </span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span className="border-b border-dotted border-muted/70">
            Live preview iframe with auto-scroll & instant reload
          </span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>GitHub sync & 1-click Vercel deployment</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>PostgreSQL & Prisma database sandboxes</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>Priority agent execution queue & zero rate limits</span>
        </div>
      </div>
    </div>
  );
}
