export interface AnalyzeInput {
  prompt: string;
  hasBuiltApp: boolean;
  hasAttachments: boolean;
  recentMessages: readonly string[];
}
