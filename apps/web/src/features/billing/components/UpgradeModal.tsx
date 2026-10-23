import { useState, useEffect, useCallback } from "react";
import { Check, Gift, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { SpecialOfferTicket } from "./SpecialOfferTicket";
import { PricingProCard } from "./PricingProCard";
import { PricingMaxCard } from "./PricingMaxCard";
import { billingApi } from "../api/billingApi";
import { useOfferCountdown } from "../hooks/useOfferCountdown";

export function UpgradeModal({
  isOpen,
  onClose,
  onOpenAddCredits,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddCredits?: () => void;
}) {
  const setPlan = useAuthStore((s) => s.setPlan);
  const updateCredits = useAuthStore((s) => s.updateCredits);

  const [loadingTier, setLoadingTier] = useState<"pro" | "max" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const [proCredits, setProCredits] = useState<number>(50);
  const [maxCredits, setMaxCredits] = useState<number>(150);

  const { hours, minutes, seconds } = useOfferCountdown();

  const handleClose = useCallback(() => {
    if (loadingTier !== null) return;
    setSuccessMessage(null);
    setLoadingTier(null);
    onClose();
  }, [loadingTier, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && loadingTier === null) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loadingTier, handleClose]);

  if (!isOpen) return null;

  const handleSelectOffer = async (tier: "pro" | "max") => {
    setLoadingTier(tier);
    setErrorMessage(null);
    const creditsUsd = tier === "pro" ? proCredits : maxCredits;
    try {
      const result = await billingApi.upgradePlan({ plan: tier === "pro" ? "PRO" : "MAX", creditsUsd });
      setPlan(result.plan);
      updateCredits(result.credits);
      setSuccessMessage(`🎉 Upgraded to Appwright ${result.plan}! +$${creditsUsd}.00 building balance added.`);
      setTimeout(handleClose, 1400);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upgrade failed. Try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:p-4 md:p-6">
      <div
        className="relative my-auto w-full max-w-5xl rounded-3xl border border-[#23262D] bg-[#0E1013] p-5 text-foreground shadow-2xl shadow-black sm:p-7 md:p-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loadingTier !== null}
          className="absolute top-4 right-4 z-20 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-40 sm:top-6 sm:right-6"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Top Special Offer Tag & Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2A6D] px-3 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-md shadow-[#FF2A6D]/20">
            <Gift className="size-3.5" />
            <span>Special Offer</span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            GO PREMIUM WITH APPWRIGHT
          </h1>
          <div className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            WITH PERSONAL{" "}
            <span className="text-[#FF2A6D]">UP TO 54% OFF</span>
          </div>
        </div>

        {/* Promo Ticket Card */}
        <SpecialOfferTicket hours={hours} minutes={minutes} seconds={seconds} />

        {/* Billing Cycle Switch */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#252830] bg-[#14161A] p-1.5 text-xs font-semibold">
            <span className={isAnnual ? "pl-2 text-muted" : "pl-2 text-white"}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual((v) => !v)}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-[#E3FC18] transition-colors focus:outline-none"
              aria-label="Toggle billing frequency"
            >
              <span
                className={`inline-block size-5 transform rounded-full bg-black shadow-md transition-transform ${
                  isAnnual ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={isAnnual ? "text-white" : "text-muted"}>
              Annual
            </span>
            <span className="rounded-full bg-[#FF2A6D] px-2 py-0.5 text-[10px] font-bold text-white">
              54% OFF
            </span>
          </div>
        </div>

        {/* Success Notification */}
        {successMessage && (
          <div className="mx-auto mt-4 flex max-w-lg items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs font-medium text-emerald-200">
            <Check className="size-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div role="alert" className="mx-auto mt-4 max-w-lg rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs font-medium text-danger">
            {errorMessage}
          </div>
        )}

        {/* Pricing Cards Grid (PRO and MAX). lg: not md: — card content (price
            labels, credit markers) needs ~950px+ to avoid wrapping, and
            768-950px is where a two-up layout looked cramped. */}
        <div className="mt-7 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {/* MAX is the "Best Value" tier, so PRO renders a touch smaller
              to keep MAX the visual focal point. */}
          <div className="lg:origin-top lg:scale-95">
            <PricingProCard
              isAnnual={isAnnual}
              proCredits={proCredits}
              setProCredits={setProCredits}
              isLoading={loadingTier === "pro"}
              onSelect={() => handleSelectOffer("pro")}
            />
          </div>
          <PricingMaxCard
            isAnnual={isAnnual}
            maxCredits={maxCredits}
            setMaxCredits={setMaxCredits}
            isLoading={loadingTier === "max"}
            onSelect={() => handleSelectOffer("max")}
          />
        </div>

        {/* Footer link to purchase individual credits */}
        <div className="mt-6 text-center text-xs text-muted">
          <span>Just want to purchase individual credit packages? </span>
          <button
            type="button"
            onClick={() => {
              handleClose();
              if (onOpenAddCredits) onOpenAddCredits();
            }}
            className="cursor-pointer font-bold text-lime underline decoration-lime/40 underline-offset-2 transition-colors hover:text-white"
          >
            Add building credits instead →
          </button>
        </div>
      </div>
    </div>
  );
}
