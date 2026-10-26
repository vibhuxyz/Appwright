import { useState } from "react";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import type { Msg } from "../schemas/agentSchemas";
import { AttachmentGallery } from "./AttachmentGallery";

const CHAR_THRESHOLD = 260;
const LINE_THRESHOLD = 5;

export function UserMessageItem({ msg }: { msg: Msg }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = msg.content.split("\n");
  const isTooBig = msg.content.length > CHAR_THRESHOLD || lines.length > LINE_THRESHOLD;
  const attachments = msg.data?.attachments ?? [];

  return (
    <div className="flex max-w-[88%] flex-col items-end gap-1.5 self-end sm:max-w-[80%]">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
        <span className="font-semibold text-[#E3FC18]">You</span>
        <div className="grid size-5.5 place-items-center rounded-full bg-[#E3FC18] text-black shadow-xs">
          <User className="size-3 text-black" />
        </div>
      </div>

      <div className="relative w-full rounded-2xl rounded-tr-xs border border-[#E3FC18]/30 bg-[#1A1F18] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap text-white shadow-md">
        <div className={isTooBig && !isExpanded ? "max-h-28 overflow-hidden" : ""}>
          {msg.content}
        </div>

        {isTooBig && !isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-9 h-12 bg-linear-to-t from-[#1A1F18] via-[#1A1F18]/80 to-transparent" />
        )}

        {isTooBig && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="relative z-10 mt-2 flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#E3FC18] transition-colors hover:text-white"
          >
            <span>{isExpanded ? "Show less" : "Read more"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        )}

        {attachments.length > 0 && <AttachmentGallery attachments={attachments} />}
      </div>
    </div>
  );
}
