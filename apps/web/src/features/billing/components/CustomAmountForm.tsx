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
  onSubmit: (amount: number) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomAmountFormValues>({
    resolver: zodResolver(customAmountFormSchema),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(Number(values.amount)))}
      className="border-t border-border-soft pt-4"
    >
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1000"
          step="1000"
          placeholder="Or enter custom amount (e.g. 100000)"
          disabled={disabled}
          className="w-full flex-1 rounded-md border border-border bg-background-deep px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:border-surface-3"
          {...register("amount")}
        />
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-md border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-3 disabled:opacity-50"
        >
          {isSubmitting ? "Adding…" : "Add Custom"}
        </button>
      </div>
      {errors.amount && (
        <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
      )}
    </form>
  );
}
