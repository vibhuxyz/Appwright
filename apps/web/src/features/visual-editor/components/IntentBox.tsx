import { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { useDesignState } from "../store/design-state";

export function IntentBox({ componentId }: { componentId: string }) {
  const [prompt, setPrompt] = useState("");
  const addIntent = useDesignState((s) => s.addIntent);
  const trimmed = prompt.trim();

  return (
    <form
      className="flex flex-col gap-2 border-t border-border-soft p-4"
      onSubmit={(event) => {
        event.preventDefault();
        addIntent({ componentId, prompt: trimmed });
        setPrompt("");
      }}
    >
      <label htmlFor="visual-editor-intent" className="text-xs text-foreground-secondary">
        Describe a change (sent to the model)
      </label>
      <textarea
        id="visual-editor-intent"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={2}
        placeholder="make this section feel more premium"
        className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={trimmed === ""}>
        Queue for the model
      </Button>
    </form>
  );
}
