export const PROJECT_MEMORY_LIMITS = {
  maxUserRows: 60,
  maxToolCallRows: 2000,
  maxOpenQuestionRows: 20,
  maxIntegrationRequestRows: 10,
  maxRecentAssistantRows: 40,
  maxTasks: 60,
} as const;

export const MEMORY_TOOL_NAMES = ["read_file", "write_file", "edit_file"] as const;

export const UNRESOLVED_QUESTION_STATUSES = ["PENDING", "DISMISSED", "EXPIRED"] as const;

export const PENDING_STATUS = "PENDING";
