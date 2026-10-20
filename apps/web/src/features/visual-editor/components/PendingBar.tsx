import { Redo2, Undo2 } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { formatPending } from "../lib/pending";
import { usePendingSummary } from "../hooks/use-pending-summary";
import { useCompileChangeSet, useSubmitChangeSet } from "../hooks/use-changeset";
import { useDesignState } from "../store/design-state";
import type { CompileResult, SubmitResult } from "../schemas/editor-schemas";

interface PendingBarProps {
  projectId: string;
  onCompiled: (result: CompileResult) => void;
  onSubmitted: (result: SubmitResult) => void;
}

export function PendingBar({ projectId, onCompiled, onSubmitted }: PendingBarProps) {
  const summary = usePendingSummary();
  const canUndo = useDesignState((s) => s.history.past.length > 0);
  const canRedo = useDesignState((s) => s.history.future.length > 0);
  const compile = useCompileChangeSet(projectId);
  const submit = useSubmitChangeSet(projectId);
  const isEmpty = summary.changeCount === 0;
  const isBusy = compile.isPending || submit.isPending;
  const error = compile.error ?? submit.error;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-soft px-4 py-2">
      <span role="status" className="text-sm font-medium text-foreground">
        {formatPending(summary)}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" size="sm" aria-label="Undo" disabled={!canUndo} onClick={() => useDesignState.getState().undo()}>
          <Undo2 className="size-3.5" aria-hidden />
        </Button>
        <Button variant="outline" size="sm" aria-label="Redo" disabled={!canRedo} onClick={() => useDesignState.getState().redo()}>
          <Redo2 className="size-3.5" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" disabled={isEmpty || isBusy} onClick={() => compile.mutate(undefined, { onSuccess: onCompiled })}>
          Review
        </Button>
        <Button size="sm" disabled={isEmpty || isBusy} onClick={() => submit.mutate(undefined, { onSuccess: onSubmitted })}>
          {submit.isPending ? "Applying…" : "Submit"}
        </Button>
        <Button variant="outline" size="sm" disabled={isEmpty || isBusy} onClick={() => useDesignState.getState().discard()}>
          Discard
        </Button>
      </div>
      {error && (
        <p role="alert" className="basis-full text-xs text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}
