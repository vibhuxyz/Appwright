export interface WorkspaceFile {
  path: string;
  content: string;
}

export interface WorkspacePlan {
  templateId: string;
  files: readonly WorkspaceFile[];
  dependencies: readonly string[];
}
