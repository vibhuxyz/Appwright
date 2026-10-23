import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { billingApi } from "../api/billingApi";

export const creditsQueryKey = ["user", "credits"] as const;

// Balance shown in the badge and the balance used to gate generation both
// come from the auth store. This query is the server copy: after a top-up
// or a failed attempt it overwrites that store so the two cannot diverge.
export function useCredits() {
  const queryClient = useQueryClient();
  const isSignedIn = useAuthStore((s) => s.user != null);
  const updateCredits = useAuthStore((s) => s.updateCredits);
  const seenMutationErrors = useRef(new Set<number>());

  const query = useQuery({
    queryKey: creditsQueryKey,
    queryFn: () => billingApi.getCredits(),
    enabled: isSignedIn,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!query.isSuccess || query.data == null) return;
    if (useAuthStore.getState().user?.credits === query.data.credits) return;
    updateCredits(query.data.credits);
  }, [query.isSuccess, query.data, updateCredits]);

  // A failed generation does not spend credits (CreditCheckFix). Refetch so
  // a cached $0 gate cannot stick after the attempt errors.
  useEffect(() => {
    return queryClient.getMutationCache().subscribe((event) => {
      const mutation = event.mutation;
      if (!mutation || mutation.state.status !== "error") return;
      const mutationId = mutation.mutationId;
      if (seenMutationErrors.current.has(mutationId)) return;
      seenMutationErrors.current.add(mutationId);
      void queryClient.invalidateQueries({ queryKey: creditsQueryKey });
    });
  }, [queryClient]);

  return query;
}

export function useAddCredits() {
  const queryClient = useQueryClient();
  const updateCredits = useAuthStore((s) => s.updateCredits);

  return useMutation({
    mutationFn: (amount: number) => billingApi.addCredits(amount),
    onSuccess: (data) => {
      updateCredits(data.credits);
      queryClient.setQueryData(creditsQueryKey, { credits: data.credits });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: creditsQueryKey });
    },
  });
}
