import { useState, useEffect, useCallback } from "react";
import { Coins, Check, AlertCircle, X, Crown, Sparkles } from "lucide-react";
import { useAddCredits, useCredits } from "../hooks/useAddCredits";
import { CREDIT_PACKAGES, formatCreditsToDollars } from "../schemas/billingSchemas";
import { useBillingModalStore } from "../store/billingModalStore";
import { CreditPackageRow } from "./CreditPackageRow";
import { CustomAmountForm } from "./CustomAmountForm";

export function AddCreditsModal({
  isOpen,
  currentCredits,
  onClose,
  onSuccess,
  onOpenUpgrade,
}: {
  isOpen: boolean;
  currentCredits: number;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
  onOpenUpgrade?: () => void;
}) {
  const addCredits = useAddCredits();
  const creditsQuery = useCredits();
  const openSpecialOffer = useBillingModalStore((s) => s.openSpecialOffer);
  // Prefer the refetch over the prop so an in-flight top-up or a failed
  // generation cannot leave this dialog on a stale balance.
  const balance = creditsQuery.data?.credits ?? currentCredits;

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (loadingId !== null) return;
    setSuccessMessage(null);
    setLoadingId(null);
    onClose();
  }, [loadingId, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && loadingId === null) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loadingId, handleClose]);

  if (!isOpen) return null;

  const submit = async (amount: number, id: string) => {
    setLoadingId(id);
    try {
      const res = await addCredits.mutateAsync(amount);
      setSuccessMessage(`Successfully added +${formatCreditsToDollars(amount)} balance!`);
      onSuccess(res.credits);
      setTimeout(() => {
        setSuccessMessage(null);
        handleClose();
        openSpecialOffer();
      }, 900);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border-soft bg-surface p-6 text-foreground shadow-2xl shadow-black/80 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle lime ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-lime/10 blur-3xl" />

        <button
          onClick={handleClose}
          disabled={loadingId !== null}
          className="absolute top-4 right-4 z-10 cursor-pointer rounded-full p-1.5 text-muted transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-40"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="relative mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/10">
              <Coins className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Add Dollar Credits
                </h2>
                <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime">
                  $10 Free on Signup
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span>Current balance:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCreditsToDollars(balance)}
                </span>
                {balance <= 0 && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger">
                    $0.00 remaining
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-foreground-secondary">
            Pay in dollars for AI generations, codebase edits, and full-stack iteration runs.
          </p>
        </div>

        {addCredits.isError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{addCredits.error.message}</span>
          </div>
        )}
        {creditsQuery.isError && balance > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-border-soft bg-surface-2 p-3 text-xs text-foreground-secondary">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Could not refresh the balance. Your last known balance is unchanged.
            </span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3 text-xs font-medium text-emerald-200">
            <Check className="size-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="mb-6 space-y-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <CreditPackageRow
              key={pkg.id}
              pkg={pkg}
              isLoading={loadingId === pkg.id}
              disabled={loadingId !== null}
              onAdd={() => submit(pkg.credits, pkg.id)}
            />
          ))}
        </div>

        <CustomAmountForm
          disabled={loadingId !== null}
          isSubmitting={loadingId === "custom"}
          onSubmit={(amount) => submit(amount, "custom")}
        />

        {onOpenUpgrade && (
          <div className="mt-5 border-t border-border-soft pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                handleClose();
                onOpenUpgrade();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
            >
              <Crown className="size-3.5 text-lime" />
              <span>Ready for unlimited generations?</span>
              <span className="flex items-center gap-1 font-semibold text-lime hover:underline">
                <Sparkles className="size-3" /> Go for Premium (Appwright Pro) →
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
