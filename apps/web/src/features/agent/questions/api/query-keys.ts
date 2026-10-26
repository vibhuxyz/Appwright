export const agentQuestionKeys = {
  all: ["agent-questions"] as const,
  pending: (sessionId: string) => ["agent-questions", sessionId] as const,
};
