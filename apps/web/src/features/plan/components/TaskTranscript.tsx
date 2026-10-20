import { useTaskAttempts } from "../hooks/use-task-attempts";

interface TaskTranscriptProps {
  runId: string;
  taskId: string;
  isTaskRunning: boolean;
}

export function TaskTranscript({ runId, taskId, isTaskRunning }: TaskTranscriptProps) {
  const { data, isPending, error } = useTaskAttempts({
    runId,
    taskId,
    isOpen: true,
    isTaskRunning,
  });

  if (isPending) return <p className="px-4 py-3 text-xs text-muted">Loading transcript…</p>;
  if (error) return <p className="px-4 py-3 text-xs text-danger">{error.message}</p>;
  if (data.length === 0) {
    return <p className="px-4 py-3 text-xs text-muted">No attempts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {data.map((attempt) => (
        <section key={attempt.id} aria-label={`Attempt ${attempt.attemptNumber}`}>
          <h4 className="text-xs font-medium text-foreground-secondary">
            Attempt {attempt.attemptNumber} · {attempt.model} · {attempt.status}
          </h4>
          {attempt.error && <p className="mt-1 text-xs text-danger">{attempt.error}</p>}
          {attempt.transcript.length === 0 ? (
            <p className="mt-1 text-xs text-muted">No transcript recorded.</p>
          ) : (
            <ol className="mt-1 flex flex-col gap-1.5">
              {attempt.transcript.map((entry, index) => (
                <li
                  key={`${attempt.id}-${index}`}
                  className="rounded-lg bg-surface-2 p-2 font-mono text-xs text-foreground-secondary"
                >
                  <span className="text-muted">{entry.role}: </span>
                  <span className="whitespace-pre-wrap">{entry.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
