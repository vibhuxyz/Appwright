import { Check, Gem, Info, Cpu, Sparkles } from "lucide-react";
import { FlagshipModelsBox } from "./SeedanceModelsBox";

export function PricingMaxCard({
  isAnnual,
  maxCredits,
  setMaxCredits,
  isLoading,
  onSelect,
}: {
  isAnnual: boolean;
  maxCredits: number;
  setMaxCredits: (val: number) => void;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const estimatedApps = Math.max(80, Math.round(maxCredits * 0.6));

  return (
    <div className="relative flex flex-col rounded-3xl border border-[#481E2F] bg-linear-to-b from-[#2A1320] via-[#1E0F18] to-[#140B11] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-2xl font-black tracking-tight text-white">MAX</span>
        <span className="rounded-full bg-[#FF2A6D] px-2.5 py-0.5 text-[11px] font-bold text-white">
          43% OFF
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          <Gem className="size-3" />
          Best Value
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground-secondary">
        For high-velocity founders, agencies & software teams
      </p>

      {/* Credits Box with Slider */}
      <div className="mt-4 rounded-2xl border border-[#431B2C] bg-[#1E0F18] p-4">
        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
          <Sparkles className="size-4 text-[#FF2A6D]" />
          <span>${maxCredits.toFixed(2)} monthly building balance</span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted">
          = ~ {estimatedApps} Production Fullstack Applications
        </p>

        {/* Slider */}
        <div className="mt-3">
          <input
            type="range"
            min="150"
            max="450"
            step="150"
            value={maxCredits}
            onChange={(e) => setMaxCredits(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#381625] accent-[#FF2A6D]"
          />
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-muted">
            <button
              type="button"
              onClick={() => setMaxCredits(150)}
              className={`cursor-pointer ${maxCredits === 150 ? "font-bold text-white" : ""}`}
            >
              🪙 $150
            </button>
            <button
              type="button"
              onClick={() => setMaxCredits(300)}
              className={`cursor-pointer ${maxCredits === 300 ? "font-bold text-white" : ""}`}
            >
              🪙 $300
            </button>
            <button
              type="button"
              onClick={() => setMaxCredits(450)}
              className={`cursor-pointer ${maxCredits === 450 ? "font-bold text-white" : ""}`}
            >
              🪙 $450
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="mt-5 flex items-baseline gap-2">
        {isAnnual && (
          <span className="text-xl font-bold text-[#FF2A6D] line-through">
            $79
          </span>
        )}
        <span className="text-3xl font-black text-white sm:text-4xl">
          {isAnnual ? "$45" : "$79"}
        </span>
        <span className="text-xs text-muted">
          {isAnnual ? "per month, billed annually" : "per month, billed monthly"}
        </span>
      </div>

      {/* Select Offer CTA Button (Pink Gradient) */}
      <button
        type="button"
        onClick={onSelect}
        disabled={isLoading}
        className="mt-4 w-full cursor-pointer rounded-xl bg-linear-to-r from-[#FF2A6D] to-[#FF4B85] py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-[#FF2A6D]/20 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50"
      >
        {isLoading ? "Processing…" : "Select Offer"}
      </button>

      <p className="mt-2 text-center text-[11px] font-medium text-muted">
        {isAnnual ? "Save $408 compared to monthly" : "Flexible monthly billing"}
      </p>

      {/* Enterprise Turbo Sandboxes */}
      <div className="mt-4 rounded-xl border border-[#381625] bg-[#1A0D15] p-3 text-xs">
        <div className="flex items-center justify-between font-bold text-white">
          <div className="flex items-center gap-1.5">
            <Cpu className="size-3.5 text-[#FF2A6D]" />
            <span className="tracking-wide uppercase">Enterprise Turbo Sandboxes</span>
          </div>
          <Info className="size-3.5 cursor-pointer text-muted" />
        </div>
        <div className="mt-2 flex items-center justify-between font-medium text-[#FF75A0]">
          <span>Dedicated high-memory compute & &lt;1.2s boot</span>
          <span className="rounded bg-[#FF2A6D]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF2A6D]">
            TURBO
          </span>
        </div>
      </div>

      {/* AI Coding Models Box */}
      <FlagshipModelsBox tier="max" />

      {/* Features Checklist */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>Everything in PRO included</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span className="border-b border-dotted border-muted/70">
            Deep reasoning models (o3-mini, o1 Pro, Claude 3.7 Thinking)
          </span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span className="border-b border-dotted border-muted/70">
            10x Parallel autonomous agent runs
          </span>
          <span className="rounded-full bg-[#FF2A6D] px-1.5 py-0.5 text-[9px] font-bold text-white">
            Max
          </span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>Custom domain SSL & dedicated edge CDN</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>Dedicated persistent cloud databases & storage</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Check className="size-3.5 shrink-0 text-[#E3FC18]" />
          <span>24/7 Priority developer Slack & engineer live support</span>
        </div>
      </div>
    </div>
  );
}
