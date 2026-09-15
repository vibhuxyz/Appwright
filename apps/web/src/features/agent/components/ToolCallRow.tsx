import { useState } from "react";
import { ChevronDown, ChevronRight, File, Loader2, Terminal } from "lucide-react";
import type { Msg } from "../schemas/agentSchemas";
import { cn } from "@/shared/lib/cn";

// Tools that act on a single file get the file-row treatment — path on the
// left, outcome on the right. Everything else stays a collapsible raw row.
const FILE_TOOLS: Record<string, string> = {
  write_file: "Created",
  edit_file: "Updated",
  read_file: "Read",
  delete_file: "Deleted",
};

function filePath(call: Msg): string | null {
  const args = call.data?.args as Record<string, unknown> | undefined;
  const path = args?.path ?? args?.file_path ?? args?.filePath;
  return typeof path === "string" ? path : null;
}

function FileToolRow({
  path,
  verb,
  response,
  failed,
}: {
  path: string;
  verb: string;
  response?: Msg;
  failed: boolean;
}) {
  const status = failed ? "Failed" : response ? verb : `${verb.replace(/e?d$/, "")}ing…`;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-surface-2 px-3 py-2.5">
      <File className="size-4 shrink-0 text-muted" />
      <span className="truncate text-[13px] text-foreground-secondary">{path}</span>
      <span
        className={cn(
          "ml-auto shrink-0 text-[11px]",
          failed ? "text-danger" : response ? "text-muted" : "text-foreground-secondary",
        )}
      >
        {status}
      </span>
      {response ? (
        <span className={cn("size-2 shrink-0 rounded-full", failed ? "bg-danger" : "bg-success")} />
      ) : (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-blue-bright" />
      )}
    </div>
  );
}

function RawToolRow({
  call,
  response,
  failed,
}: {
  call: Msg;
  response?: Msg;
  failed: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border-soft bg-surface-2 text-xs">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <Terminal className="size-4 shrink-0 text-muted" />
        <span className="truncate font-mono text-[12px] text-foreground-secondary">
          {call.content}
        </span>
        <span
          className={cn(
            "ml-auto shrink-0 text-[11px]",
            failed ? "text-danger" : response ? "text-success" : "text-muted",
          )}
        >
          {failed ? "Failed" : response ? "Done" : "Running…"}
        </span>
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted" />
        )}
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-border-soft px-3 py-2 font-mono text-[11px] whitespace-pre-wrap text-muted">
          {JSON.stringify(call.data?.args, null, 2)}
          {response && (
            <div className="mt-2 border-t border-border-soft pt-2">{response.content}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolCallRow({ call, response }: { call: Msg; response?: Msg }) {
  const failed = !!response?.content.startsWith("Error:");
  const path = filePath(call);
  const verb = FILE_TOOLS[call.data?.toolName ?? ""];

  return path && verb ? (
    <FileToolRow path={path} verb={verb} response={response} failed={failed} />
  ) : (
    <RawToolRow call={call} response={response} failed={failed} />
  );
}
