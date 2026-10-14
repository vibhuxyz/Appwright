import { Coins, Sparkles, Zap, Layers } from "lucide-react";
import type { CreditPackage } from "../schemas/billingSchemas";

function getPackageIcon(id: string) {
  switch (id) {
    case "starter":
      return <Zap className="size-4 text-amber-400" />;
    case "builder":
      return <Layers className="size-4 text-lime" />;
    case "pro":
      return <Sparkles className="size-4 text-pink-light" />;
    default:
      return <Coins className="size-4 text-blue-400" />;
  }
}

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
  const isPopular = pkg.id === "builder";

  return (
    <div
      className={`group relative flex items-center justify-between rounded-xl border p-4 transition-all ${
        isPopular
          ? "border-lime/30 bg-surface-2 shadow-xs shadow-lime/5 hover:border-lime/60 hover:bg-surface-3"
          : "border-border-soft bg-surface-2 hover:border-border hover:bg-surface-3"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3 pr-3">
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border-soft bg-surface">
          {getPackageIcon(pkg.id)}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {pkg.title}
            </span>
            <span className="font-mono text-xs font-semibold text-lime">
              +{pkg.dollarValue} Balance
            </span>
            {pkg.badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                  isPopular
                    ? "border border-lime/40 bg-lime/10 text-lime"
                    : "border border-pink/40 bg-pink/10 text-pink"
                }`}
              >
                {pkg.badge}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted">
            <span className="font-medium text-foreground-secondary">{pkg.appsEstimate}</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span>{pkg.description}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="shrink-0 cursor-pointer rounded-lg bg-lime px-4 py-2 text-xs font-bold text-background-deep shadow-xs transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Adding…" : `Buy $${pkg.priceDollars}`}
      </button>
    </div>
  );
}
