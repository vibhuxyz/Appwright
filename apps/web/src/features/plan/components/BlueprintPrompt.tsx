import { useState, type FormEvent } from "react";
import { Blocks } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Button } from "@/shared/components/ui/Button";

export function BlueprintPrompt({
  isSubmitting,
  error,
  onSubmit,
}: {
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  };

  return (
    <Panel className="flex-1">
      <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="max-w-sm text-[13px] text-muted">
          Describe the app you want. A planner turns it into a frozen architecture and a visible
          task list, then builds it task by task.
        </p>
        <form className="flex w-full max-w-sm flex-col gap-2" onSubmit={submit}>
          <label className="sr-only" htmlFor="blueprint-prompt">
            App description
          </label>
          <textarea
            id="blueprint-prompt"
            value={prompt}
            disabled={isSubmitting}
            placeholder="Build me a food delivery app"
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            className="min-w-0 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          <Button type="submit" disabled={isSubmitting || prompt.trim().length === 0}>
            {isSubmitting ? "Loading design directions…" : "Continue"}
          </Button>
        </form>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Panel>
  );
}
