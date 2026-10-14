import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { PRICING_MONTHLY, PRICING_YEARLY } from "../data/sectionContent";

interface PricingSectionProps {
  onFreeClick: () => void;
  onProClick: () => void;
}

export function PricingSection({ onFreeClick, onProClick }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const prices = isYearly ? PRICING_YEARLY : PRICING_MONTHLY;
  const per = isYearly ? "/mo billed yearly" : "/month";

  return (
    <section id="pricing" className="border-b border-border-soft px-6 py-16 sm:py-26">
      <div className="mx-auto max-w-300">
        <div className="mx-auto mb-4 max-w-155 text-center">
          <span className="inline-block rounded-full bg-pink px-2.75 py-1.25 text-xs font-extrabold tracking-wide text-white">
            54% OFF · LAUNCH WEEK
          </span>
          <p className="mt-4.5 text-[26px] leading-tight font-bold tracking-tighter sm:text-[42px]">
            Pay for shipped apps, not seats.
          </p>
          <p className="mt-3 text-[15.5px] leading-relaxed text-foreground-secondary">
            Build free forever. Upgrade when you deploy to production.
          </p>
        </div>

        <div className="my-6.5 flex justify-center">
          <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "cursor-pointer rounded-full px-4.5 py-2 text-[13px] font-semibold",
                !isYearly ? "bg-lime text-background-deep" : "text-foreground-secondary",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "cursor-pointer rounded-full px-4.5 py-2 text-[13px] font-semibold",
                isYearly ? "bg-lime text-background-deep" : "text-foreground-secondary",
              )}
            >
              Yearly · −20%
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <div className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-surface p-6.5">
            <div className="text-[13px] font-bold tracking-widest text-muted">FREE</div>
            <div className="text-[42px] font-extrabold tracking-tighter">$0</div>
            <div className="text-sm leading-relaxed text-foreground-secondary">
              3 projects, unlimited previews, community models.
            </div>
            <button
              type="button"
              onClick={onFreeClick}
              className="mt-auto cursor-pointer rounded-[11px] border border-border bg-surface-2 py-3 text-sm font-semibold text-foreground"
            >
              Start free
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-linear-to-b from-[#788c28]/20 to-white/3 p-6.5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold tracking-widest text-lime">PRO</div>
              <span className="rounded-full bg-surface-2 px-2.25 py-1 text-[11px] font-bold text-foreground-secondary">
                MOST PICKED
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[42px] font-extrabold tracking-tighter">{prices.pro}</span>
              <span className="text-sm text-muted">{per}</span>
            </div>
            <div className="text-sm leading-relaxed text-foreground-secondary">
              Unlimited projects, production deploys, frontier agent models, test autofix.
            </div>
            <button
              type="button"
              onClick={onProClick}
              className="mt-auto cursor-pointer rounded-[11px] bg-lime py-3.5 text-[14.5px] font-bold text-background-deep hover:brightness-110"
            >
              Select Pro
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-linear-to-b from-[#961946]/28 to-white/3 p-6.5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold tracking-widest text-pink-light">MAX</div>
              <span className="rounded-full bg-pink px-2.25 py-1 text-[11px] font-extrabold text-white">
                59% OFF
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[42px] font-extrabold tracking-tighter">{prices.max}</span>
              <span className="text-sm text-muted">{per}</span>
            </div>
            <div className="text-sm leading-relaxed text-foreground-secondary">
              Parallel agents, private infrastructure, SOC 2 artifacts, priority build queue.
            </div>
            <button
              type="button"
              onClick={onProClick}
              className="mt-auto cursor-pointer rounded-[11px] bg-linear-to-r from-pink to-pink-light py-3.5 text-[14.5px] font-bold text-white hover:brightness-110"
            >
              Claim discount
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-border bg-surface p-6.5">
            <div className="text-[13px] font-bold tracking-widest text-blue">ENTERPRISE</div>
            <div className="text-[30px] font-extrabold tracking-tight">Talk to us</div>
            <div className="text-sm leading-relaxed text-foreground-secondary">
              Self-hosted runners, VPC deploys, audit trails, dedicated support.
            </div>
            <a
              href="#top"
              className="mt-auto rounded-[11px] border border-border bg-surface-2 py-3 text-center text-sm font-semibold text-foreground"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
