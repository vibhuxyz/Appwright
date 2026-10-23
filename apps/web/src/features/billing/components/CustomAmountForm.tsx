import { usdToCredits } from "@repo/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  customAmountFormSchema,
  type CustomAmountForm as CustomAmountFormValues,
} from "../schemas/billingSchemas";

export function CustomAmountForm({
  disabled,
  isSubmitting,
  onSubmit,
}: {
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (creditsToAdd: number) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomAmountFormValues>({
    resolver: zodResolver(customAmountFormSchema),
  });

  const handleQuickAdd = (dollars: number) => {
    setValue("amount", String(dollars));
    onSubmit(usdToCredits(dollars));
  };

  const onFormSubmit = (values: CustomAmountFormValues) => {
    const dollars = Number(values.amount);
    onSubmit(usdToCredits(dollars));
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="border-t border-border-soft pt-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground-secondary">
          Custom Dollar Amount
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleQuickAdd(10)}
            className="cursor-pointer rounded-md border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted hover:border-border hover:text-foreground disabled:opacity-40"
          >
            +$10
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleQuickAdd(25)}
            className="cursor-pointer rounded-md border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted hover:border-border hover:text-foreground disabled:opacity-40"
          >
            +$25
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleQuickAdd(50)}
            className="cursor-pointer rounded-md border border-border-soft bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted hover:border-border hover:text-foreground disabled:opacity-40"
          >
            +$50
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-xs text-muted">
            $
          </span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Enter custom dollars (e.g. 15)"
            disabled={disabled}
            className="w-full rounded-xl border border-border bg-background-deep py-2 pr-3.5 pl-7 font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted focus:border-lime/60 focus:ring-1 focus:ring-lime/40 focus:outline-none"
            {...register("amount")}
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-xl border border-border-soft bg-surface-2 px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-border hover:bg-surface-3 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Adding…" : "Add Funds"}
        </button>
      </div>
      {errors.amount && (
        <p className="mt-1.5 text-xs text-danger">{errors.amount.message}</p>
      )}
    </form>
  );
}
