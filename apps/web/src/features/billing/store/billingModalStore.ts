import { create } from "zustand";

interface BillingModalState {
  isAddCreditsOpen: boolean;
  isUpgradeOpen: boolean;
  isSpecialOfferOpen: boolean;
  openAddCredits: () => void;
  closeAddCredits: () => void;
  openUpgrade: () => void;
  closeUpgrade: () => void;
  openSpecialOffer: () => void;
  closeSpecialOffer: () => void;
}

export const useBillingModalStore = create<BillingModalState>((set) => ({
  isAddCreditsOpen: false,
  isUpgradeOpen: false,
  isSpecialOfferOpen: false,
  openAddCredits: () =>
    set({
      isAddCreditsOpen: true,
      isUpgradeOpen: false,
      isSpecialOfferOpen: false,
    }),
  closeAddCredits: () => set({ isAddCreditsOpen: false }),
  openUpgrade: () =>
    set({
      isUpgradeOpen: true,
      isAddCreditsOpen: false,
      isSpecialOfferOpen: false,
    }),
  closeUpgrade: () => set({ isUpgradeOpen: false }),
  openSpecialOffer: () =>
    set({
      isSpecialOfferOpen: true,
      isAddCreditsOpen: false,
    }),
  closeSpecialOffer: () => set({ isSpecialOfferOpen: false }),
}));
