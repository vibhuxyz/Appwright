import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";

const TIPS = [
  "Press Enter to send, Shift + Enter for a new line",
  "Click 'Enhance Prompt' to expand short prompts into detailed specifications",
  "Be specific about data structures, styling preferences, and responsive design",
  "Ask the agent to refactor components, debug errors, or add new features",
];

export function ChatTips() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-2.5 flex items-center gap-2 px-1 text-xs text-muted transition-opacity duration-300">
      <Lightbulb className="size-3.5 shrink-0 text-lime" />
      <span className="truncate">
        <span className="font-semibold text-foreground-secondary">Tip:</span>{" "}
        {TIPS[index]}
      </span>
    </div>
  );
}
