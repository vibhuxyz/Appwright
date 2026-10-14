import { create } from "zustand";

export const WORKSPACE_TABS = [
  "code",
  "preview",
  "diff",
  "database",
  "logs",
  "analytics",
  "settings",
] as const;

export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export type PreviewDevice = "desktop" | "mobile" | "tablet";

interface WorkspaceState {
  selectedFile: string | null;
  openFiles: string[];
  selectFile: (path: string | null) => void;
  closeFile: (path: string) => void;
  /**
   * Exactly one workspace surface is visible at a time — picking "code" hides
   * the preview entirely and vice versa. They are tabs, not a split.
   */
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
}

// Which file is open is UI state — the file's actual content lives in
// TanStack Query, fetched fresh whenever the selection changes.
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedFile: null,
  openFiles: [],
  selectFile: (path) =>
    set((state) => ({
      selectedFile: path,
      openFiles:
        path && !state.openFiles.includes(path) ? [...state.openFiles, path] : state.openFiles,
    })),
  closeFile: (path) =>
    set((state) => {
      const openFiles = state.openFiles.filter((p) => p !== path);
      const selectedFile =
        state.selectedFile === path ? (openFiles.at(-1) ?? null) : state.selectedFile;
      return { openFiles, selectedFile };
    }),
  activeTab: "code",
  setActiveTab: (activeTab) => set({ activeTab }),
  previewDevice: "desktop",
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
}));
