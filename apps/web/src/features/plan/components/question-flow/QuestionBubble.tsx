import type { ReactNode } from "react";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface QuestionBubbleProps {
  role: "assistant" | "user";
  children: ReactNode;
}

export function QuestionBubble({ role, children }: QuestionBubbleProps) {
  const isUser = role === "user";
  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-surface-3 text-foreground-secondary" : "bg-lime/15 text-lime",
        )}
        aria-hidden
      >
        {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </span>
      <p
        className={cn(
          "max-w-[85%] text-sm text-foreground",
          isUser ? "rounded-xl bg-surface-2 px-3 py-2" : "pt-0.5 font-medium",
        )}
      >
        {children}
      </p>
    </div>
  );
}
