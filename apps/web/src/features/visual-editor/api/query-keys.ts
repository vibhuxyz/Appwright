export const editorKeys = {
  components: (projectId: string) => ["visual-editor", "components", projectId] as const,
  compile: (projectId: string) => ["visual-editor", "compile", projectId] as const,
};
