import { SKIPPED_REPLY_TEXT, type QuestionReplyData } from "@repo/contracts";

export function QuestionReplyBubble({ reply }: { reply: QuestionReplyData }) {
  const isSkipped = reply.outcome === "skipped" || reply.items.length === 0;
  return (
    <div className="max-w-[88%] self-end rounded-2xl rounded-tr-xs border border-info/20 bg-info/10 px-4 py-3 text-[13px] leading-relaxed sm:max-w-[80%]">
      {isSkipped ? (
        <p className="text-foreground">{SKIPPED_REPLY_TEXT}</p>
      ) : (
        <dl className="space-y-2.5">
          {reply.items.map((item, index) => (
            <div key={`${index}-${item.label}`}>
              <dt className="text-foreground-secondary">{item.label} — {item.text}</dt>
              <dd className="font-semibold text-foreground">{item.answer}</dd>
            </div>
          ))}
          {reply.moreCount > 0 && <p className="text-muted">(+{reply.moreCount} more)</p>}
        </dl>
      )}
    </div>
  );
}
