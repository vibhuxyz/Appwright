import type { ElementSelection } from "@repo/contracts";
import { create } from "zustand";

interface SelectionState {
  isEditMode: boolean;
  selection: ElementSelection | null;
  setEditMode: (isEditMode: boolean) => void;
  select: (selection: ElementSelection) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  isEditMode: false,
  selection: null,
  setEditMode: (isEditMode) =>
    set(isEditMode ? { isEditMode } : { isEditMode, selection: null }),
  select: (selection) => set({ selection }),
  clearSelection: () => set({ selection: null }),
}));

export const selectionStore = useSelectionStore;
