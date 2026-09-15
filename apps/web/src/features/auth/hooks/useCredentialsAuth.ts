import { useMutation } from "@tanstack/react-query";
import { setToken } from "@/shared/lib/httpClient";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "../api/authApi";

export function useCredentialsAuth(mode: "login" | "register") {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      mode === "login"
        ? authApi.login(email, password)
        : authApi.register(email, password),
    onSuccess: (result) => {
      setToken(result.token);
      setUser(result.user);
    },
  });
}
