interface DiffHunkViewerProps {
  diffText: string;
}

export function DiffHunkViewer({ diffText }: DiffHunkViewerProps) {
  const lines = diffText.split("\n");

  return (
    <div className="h-full overflow-auto bg-surface p-3 font-mono text-xs">
      {lines.map((line, idx) => {
        let style = "text-foreground-secondary";
        let bg = "";

        if (line.startsWith("+++") || line.startsWith("---")) {
          style = "text-muted font-semibold";
        } else if (line.startsWith("+")) {
          style = "text-emerald-400";
          bg = "bg-emerald-500/10";
        } else if (line.startsWith("-")) {
          style = "text-rose-400";
          bg = "bg-rose-500/10";
        } else if (line.startsWith("@@")) {
          style = "text-cyan-400 font-semibold";
          bg = "bg-cyan-500/10";
        }

        return (
          <div key={idx} className={`whitespace-pre px-2 py-0.5 ${style} ${bg}`}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
