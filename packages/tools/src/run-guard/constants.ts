export const CACHEABLE_TOOLS: ReadonlySet<string> = new Set(["read_file", "list_files", "grep"]);

export const MUTATING_TOOLS: ReadonlySet<string> = new Set(["write_file", "edit_file", "bash"]);

export const READ_TOOL = "read_file";
export const WRITE_TOOL = "write_file";
export const EDIT_TOOL = "edit_file";
export const BASH_TOOL = "bash";

export const PACKAGE_JSON_PATH = "package.json";

export const CODE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?)$/i;

export const LOCAL_SPECIFIER_PREFIXES = [
  ".",
  "/",
  "@/",
  "~/",
  "#",
  "node:",
  "bun:",
  "virtual:",
  "data:",
  "http:",
  "https:",
] as const;
