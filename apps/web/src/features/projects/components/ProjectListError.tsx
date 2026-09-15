export function ProjectListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-danger">
      <span>Couldn't load projects.</span>
      <button onClick={onRetry} className="underline hover:brightness-110">
        Retry
      </button>
    </div>
  );
}
