import { useState } from "react";
import { useAddCredits } from "../hooks/useAddCredits";
import { CREDIT_PACKAGES } from "../schemas/billingSchemas";
import { CreditPackageRow } from "./CreditPackageRow";
import { CustomAmountForm } from "./CustomAmountForm";

export function AddCreditsModal({
  isOpen,
  currentCredits,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  currentCredits: number;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
}) {
  const addCredits = useAddCredits();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (amount: number, id: string) => {
    setLoadingId(id);
    try {
      const res = await addCredits.mutateAsync(amount);
      setSuccessMessage(`Successfully added ${amount.toLocaleString()} credits!`);
      onSuccess(res.credits);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl rounded-xl border border-border-soft bg-surface p-6 text-foreground shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={loadingId !== null}
          className="absolute top-4 right-4 cursor-pointer p-1 text-lg text-muted hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <h2 className="text-xl font-bold">Add Building Credits</h2>
          </div>
          <p className="text-xs text-muted">
            Current balance:{" "}
            <span className="font-semibold text-foreground">
              {currentCredits.toLocaleString()} Credits
            </span>{" "}
            {currentCredits <= 0 && (
              <span className="font-medium text-danger">(Out of credits)</span>
            )}
          </p>
        </div>

        {addCredits.isError && (
          <div className="mb-4 rounded-md border border-red-800/80 bg-red-950/60 p-2.5 text-xs text-red-200">
            ⚠️ {addCredits.error.message}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-md border border-emerald-800/80 bg-emerald-950/60 p-2.5 text-xs text-emerald-200">
            ✓ {successMessage}
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
      </div>
    </div>
  );
}
