import { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/cn";
import { DEFAULT_PROMPT, QUICK_PROMPTS, STACK_BADGES } from "../data/content";

export function PromptComposer({ onSubmit }: { onSubmit: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT);

  return (
    <div className="sticky top-19 z-30 mx-auto max-w-270 px-6 pt-5 pb-4 text-center sm:pt-8 sm:pb-5">
      <div
        className={cn(
          "pointer-events-auto mx-auto text-left transition-[max-width] duration-300 ease-out",
          isOpen ? "max-w-210" : "max-w-155",
        )}
      >
        {isOpen ? (
          <div className="rounded-[20px] border border-[#3a3d3f] bg-surface p-3.5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-2 px-1.5 pb-2.5 font-geist-mono text-xs text-muted">
              <span className="size-[7px] animate-pulse-dot rounded-full bg-lime" />
              appwright agent · ready
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-auto cursor-pointer font-geist-mono text-xs text-muted hover:text-foreground"
              >
                collapse ↑
              </button>
            </div>
            <textarea
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              rows={3}
              placeholder="Build me an ecommerce app with login, products, cart, Stripe payments, admin dashboard and deployment."
              className="block w-full resize-none rounded-2xl border border-border-soft bg-background px-4.5 py-4 text-base leading-relaxed text-foreground outline-none focus:border-[#3a3d3f]"
            />
            <div className="flex flex-wrap gap-2 px-0.5 pt-3">
              {QUICK_PROMPTS.map((quickPrompt) => (
                <button
                  key={quickPrompt.label}
                  type="button"
                  onClick={() => setPromptText(quickPrompt.prompt)}
                  className="cursor-pointer rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:bg-surface-3 hover:text-foreground"
                >
                  {quickPrompt.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-3.5">
              <div className="flex min-w-45 flex-1 items-center gap-2 font-geist-mono text-xs text-muted">
                {STACK_BADGES.map((stack) => (
                  <span
                    key={stack}
                    className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-foreground-secondary"
                  >
                    {stack}
                  </span>
                ))}
              </div>
              <a
                href="#how"
                className="rounded-[11px] border border-border bg-surface-2 px-4.5 py-3 text-sm font-semibold text-foreground"
              >
                See the run
              </a>
              <Button
                variant="primary"
                size="lg"
                className="w-auto rounded-[11px] px-6.5 py-3.5 text-[14.5px] shadow-[0_14px_40px_-18px_rgba(227,252,24,0.6)]"
                onClick={onSubmit}
              >
                Build it free
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex w-full cursor-text items-center gap-3.5 rounded-full border border-border bg-surface py-2.5 pr-2.5 pl-5.5 text-left shadow-[0_22px_60px_-34px_rgba(0,0,0,0.95)] hover:border-[#3a3d3f]"
          >
            <span className="size-[7px] flex-none animate-pulse-dot rounded-full bg-lime" />
            <span className="min-w-0 flex-1 truncate font-geist text-[15px] text-muted">
              Describe the app you want to build…
            </span>
            <span className="flex-none rounded-full bg-lime px-6 py-3 text-[14.5px] font-bold text-background-deep">
              Build it free
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
