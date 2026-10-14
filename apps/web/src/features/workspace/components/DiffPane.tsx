import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GitMerge, RotateCcw } from "lucide-react";
import { agentApi } from "@/features/agent/api/agentApi";
import { DiffHunkViewer } from "./DiffHunkViewer";
import { DiffFileList } from "./DiffFileList";
import { MergeStatusBanner } from "./MergeStatusBanner";

interface DiffPaneProps {
  sessionId: string;
}

export function DiffPane({ sessionId }: DiffPaneProps) {
  const queryClient = useQueryClient();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const { data: diffs = [], isLoading } = useQuery({
    queryKey: ["diff", sessionId],
    queryFn: () => agentApi.getDiff(sessionId),
  });

  const mergeMutation = useMutation({
    mutationFn: () => agentApi.mergeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diff", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["projectFiles"] });
    },
  });

  const revertMutation = useMutation({
    mutationFn: () => agentApi.revertSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diff", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["projectFiles"] });
    },
  });

  const activeDiff = diffs.find((d) => d.path === selectedPath) ?? diffs[0];
  const mergeResult = mergeMutation.data;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Loading git diffs…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Session Diff vs Main</span>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted">
            {diffs.length} changed {diffs.length === 1 ? "file" : "files"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={revertMutation.isPending || diffs.length === 0}
            onClick={() => revertMutation.mutate()}
            className="flex items-center gap-1.5 rounded-lg border border-border-soft bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:bg-surface-3 disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            <span>Revert Checkpoint</span>
          </button>
          <button
            type="button"
            disabled={mergeMutation.isPending || diffs.length === 0}
            onClick={() => mergeMutation.mutate()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <GitMerge className="size-3.5" />
            <span>Merge to Main</span>
          </button>
        </div>
      </div>

      {mergeResult && (
        <MergeStatusBanner
          result={mergeResult}
          onDismiss={() => mergeMutation.reset()}
        />
      )}

      <div className="flex min-h-0 flex-1">
        <DiffFileList
          diffs={diffs}
          selectedPath={activeDiff?.path ?? null}
          onSelect={setSelectedPath}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          {activeDiff ? (
            <DiffHunkViewer diffText={activeDiff.diff} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Select a file to inspect diff
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
