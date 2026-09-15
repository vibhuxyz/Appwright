import { useMutation } from "@tanstack/react-query";
import { billingApi } from "../api/billingApi";

export function useAddCredits() {
  return useMutation({
    mutationFn: (amount: number) => billingApi.addCredits(amount),
  });
}
