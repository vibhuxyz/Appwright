import { describe, expect, it } from "bun:test";
import {
  QUESTION_TRANSCRIPT_LIMITS,
  QuestionReplyDataSchema,
  QuestionSetDataSchema,
  SKIPPED_REPLY_TEXT,
  agentQuestionReply,
  flattenTranscriptText,
  imageQuestionSet,
  imageReply,
  integrationReply,
  formatQuestionReplyContent,
  formatQuestionSetContent,
} from "../src";

const set = QuestionSetDataSchema.parse({
  kind: "intake",
  intro: "Before I start, please confirm these key details:",
  items: [
    { label: "Primary Action", text: "What should visitors do first?", options: ["Call", "WhatsApp"] },
    { label: "Language", text: "What should the website use?", options: ["English", "Hindi"] },
  ],
});

describe("formatQuestionSetContent", () => {
  it("numbers questions and letters their options", () => {
    const content = formatQuestionSetContent(set);
    expect(content).toContain("1. Primary Action — What should visitors do first?");
    expect(content).toContain("   b) WhatsApp");
    expect(content.startsWith("Before I start")).toBe(true);
  });
});

describe("formatQuestionReplyContent", () => {
  it("pairs each question with its answer", () => {
    const reply = QuestionReplyDataSchema.parse({
      kind: "intake",
      outcome: "answered",
      items: [{ label: "Language", text: "What should the website use?", answer: "English" }],
      moreCount: 2,
    });
    expect(formatQuestionReplyContent(reply)).toBe("Language — What should the website use?\nEnglish\n\n(+2 more)");
  });

  it("says the user skipped, and lists the defaults when there are any", () => {
    expect(formatQuestionReplyContent(QuestionReplyDataSchema.parse({ kind: "agent", outcome: "skipped", items: [] }))).toBe(SKIPPED_REPLY_TEXT);
    const withDefaults = QuestionReplyDataSchema.parse({
      kind: "intake",
      outcome: "skipped",
      items: [{ label: "Language", text: "What should the website use?", answer: "English (default)" }],
    });
    expect(formatQuestionReplyContent(withDefaults)).toBe(
      "User skipped — going with these defaults:\n\nLanguage — What should the website use?\nEnglish (default)",
    );
  });

  it("keeps the content inside the byte budget", () => {
    const answer = "न".repeat(QUESTION_TRANSCRIPT_LIMITS.maxAnswerChars);
    const items = Array.from({ length: QUESTION_TRANSCRIPT_LIMITS.maxItems }, (_, index) => ({
      label: `Question ${index}`,
      text: "What should we show?",
      answer,
    }));
    const content = formatQuestionReplyContent(QuestionReplyDataSchema.parse({ kind: "intake", outcome: "answered", items }));
    expect(new TextEncoder().encode(content).length).toBeLessThanOrEqual(QUESTION_TRANSCRIPT_LIMITS.maxContentBytes);
    expect(content.endsWith("…")).toBe(true);
  });
});

describe("flattenTranscriptText", () => {
  it("flattens whitespace and truncates to the limit", () => {
    expect(flattenTranscriptText("  Hero\r\n section  ", 40)).toBe("Hero section");
    expect(flattenTranscriptText("abcdefghij", 5)).toBe("abcd…");
  });
});

describe("reply builders", () => {
  const question = {
    label: "Payment",
    text: "What should customers pay for?",
    options: ["Booking fee", "Advance"],
    defaultOptionIndex: 0,
    inputType: "single" as const,
  };

  it("joins chosen options with the user's own text", () => {
    const reply = agentQuestionReply([question], [{ selectedOptionIndexes: [1], otherText: " Custom\namount " }]);
    expect(reply.items[0]?.answer).toBe("Advance; Custom amount");
    expect(agentQuestionReply([question], null).outcome).toBe("skipped");
  });

  it("names the connection mode, or skips when nothing connected", () => {
    const reply = integrationReply([{ provider: "razorpay", status: "CONNECTED", credentialMode: "APPWRITE_MANAGED" }]);
    expect(reply.items[0]).toEqual({ label: "Razorpay", text: "How should I connect it?", answer: "Appwright test key" });
    expect(integrationReply([{ provider: "mongodb", status: "DISMISSED" }]).outcome).toBe("skipped");
  });

  it("labels image sections and reports each source", () => {
    const slot = { componentName: "HeroSection", pageRoute: "/" };
    expect(imageQuestionSet("Choose images", [slot]).items[0]).toMatchObject({
      label: "Hero Section",
      text: "Which image should this section on the home page use?",
    });
    const reply = imageReply([{ ...slot, status: "RESOLVED", source: "UPLOADED" }]);
    expect(reply.items[0]?.answer).toBe("Uploaded my own");
    expect(imageReply([{ ...slot, status: "SKIPPED", source: null }]).outcome).toBe("skipped");
  });

  it("turns pattern ids into readable section names", () => {
    expect(imageQuestionSet("Choose", [{ componentName: "commerce.split-promo", pageRoute: "/" }]).items[0]?.label).toBe("Commerce split promo");
    expect(imageQuestionSet("Choose", [{ componentName: "hero.editorial", pageRoute: "/" }]).items[0]?.label).toBe("Hero editorial");
    expect(imageQuestionSet("Choose", [{ componentName: "OpenGraphImage", pageRoute: "/" }]).items[0]?.label).toBe("Open Graph Image");
  });

  it("attaches a thumbnail only for resolved photos on https URLs", () => {
    const base = { componentName: "HeroSection", pageRoute: "/", source: "SEARCHED" as const };
    const reply = imageReply([
      { ...base, status: "RESOLVED", imageUrl: "https://images.unsplash.com/photo-1?w=1080" },
      { ...base, status: "RESOLVED", imageUrl: "/uploads/local.png" },
      { ...base, status: "SKIPPED", imageUrl: "https://images.unsplash.com/photo-2" },
    ]);
    expect(reply.items.map((item) => item.imageUrl)).toEqual(["https://images.unsplash.com/photo-1?w=1080", undefined, undefined]);
  });
});
