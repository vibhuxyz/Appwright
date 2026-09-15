import type { CreditPackage } from "../schemas/billingSchemas";

export function CreditPackageRow({
  pkg,
  isLoading,
  disabled,
  onAdd,
}: {
  pkg: CreditPackage;
  isLoading: boolean;
  disabled: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="group relative flex items-center justify-between rounded-lg border border-border-soft bg-surface-2 p-3.5 transition-all hover:border-border hover:bg-surface-3">
      <div className="flex min-w-0 flex-col pr-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {pkg.title}
          </span>
          <span className="font-mono text-xs font-bold text-blue-400">
            +{pkg.credits.toLocaleString()} Credits
          </span>
          {pkg.badge && (
            <span className="rounded-full border border-pink/40 bg-pink/10 px-2 py-0.5 text-[10px] font-medium text-pink">
              {pkg.badge}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted">
          {pkg.appsEstimate} · {pkg.description}
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="shrink-0 cursor-pointer rounded-md bg-lime px-3.5 py-1.5 text-xs font-semibold text-background-deep transition-all hover:brightness-110 disabled:opacity-50"
      >
        {isLoading ? "Adding…" : "+ Add"}
      </button>
    </div>
  );
}
