import { formatQuestionReplyContent, type QuestionReplyData } from "@repo/contracts";
import type { InteractiveToolContext } from "./types";

export async function saveQuestionReply(ctx: InteractiveToolContext, reply: QuestionReplyData): Promise<void> {
  await ctx.persist({
    role: "user",
    type: "text",
    content: formatQuestionReplyContent(reply),
    data: { questionReply: reply, transcriptOnly: true },
  });
}
