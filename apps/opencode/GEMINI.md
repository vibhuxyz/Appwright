# Gemini CLI Instructions

## Safety & Stability
- **Code Integrity:** When editing files that define system prompts or configurations (e.g., `src/engine/systemPrompt.ts`), always ensure that special characters (like backticks in template literals) are properly escaped to prevent syntax errors and application crashes.
- **Verification:** After making changes to the core engine or system prompts, verify that the application still compiles and runs.

## Reporting & Transparency
- **File Mutations:** When using mutating tools (`write_file`, `edit_file`, `bash`), you MUST explicitly describe your action.
  - For `edit_file`, clearly state what is being removed and what is being added, and identify the affected lines.
  - For `write_file`, state that you are creating/overwriting a file at a specific path.
  - For `bash`, state exactly what command you are running and its purpose.
