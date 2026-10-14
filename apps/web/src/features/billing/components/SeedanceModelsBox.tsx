import { Bot, Sparkles, Cpu } from "lucide-react";

export function FlagshipModelsBox({ tier = "pro" }: { tier?: "pro" | "max" }) {
  const isMax = tier === "max";

  return (
    <div className="mt-2 rounded-xl border border-[#1E3356] bg-linear-to-r from-[#0F203D] to-[#0D182E] p-2 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold tracking-wide text-white uppercase">
            Access to <span className="text-[#60A5FA]">AI Coding Models</span>
          </div>
          <div className="text-[10px] text-blue-200/70">
            {isMax ? "Elite reasoning & deep thinking line-up" : "Full flagship developer models included"}
          </div>
        </div>
        <div className="grid size-6 place-items-center rounded-md bg-[#1B3461] text-blue-300">
          <Sparkles className="size-3" />
        </div>
      </div>

      <div className="mt-1.5 space-y-1">
        <div className="flex items-center justify-between rounded-md bg-[#142340] px-2 py-0.5 text-[10px]">
          <div className="flex items-center gap-1.5 text-white">
            <Bot className="size-3 text-purple-400" />
            <span className="font-semibold">Claude 3.7 Sonnet</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded bg-[#1A2D50] px-1 py-0.5 text-[9px] text-purple-200">
              {isMax ? "Reasoning Max" : "Thinking"}
            </span>
            <span className="rounded bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-bold text-white">
              Full access
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md bg-[#142340] px-2 py-0.5 text-[10px]">
          <div className="flex items-center gap-1.5 text-white">
            <Cpu className="size-3 text-emerald-400" />
            <span className="font-semibold">{isMax ? "OpenAI o3-mini & GPT-4o" : "OpenAI GPT-4o"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded bg-[#1A2D50] px-1 py-0.5 text-[9px] text-emerald-200">
              {isMax ? "Deep Logic" : "Speed"}
            </span>
            <span className="rounded bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-bold text-white">
              Full access
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md bg-[#142340] px-2 py-0.5 text-[10px]">
          <div className="flex items-center gap-1.5 text-white">
            <Sparkles className="size-3 text-amber-400" />
            <span className="font-semibold">{isMax ? "Gemini 2.0 Pro Exp" : "Gemini 2.0 Flash"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded bg-[#1A2D50] px-1 py-0.5 text-[9px] text-amber-200">
              {isMax ? "2M Context" : "Agent Loop"}
            </span>
            <span className="rounded bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-bold text-white">
              Full access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
