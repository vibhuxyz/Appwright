import { httpClient } from "@/shared/lib/httpClient";
import { authResponseSchema, userSchema } from "../schemas/authSchemas";

export const authApi = {
  register: (email: string, password: string) =>
    httpClient
      .post("/auth/register", { email, password })
      .then(authResponseSchema.parse),
  login: (email: string, password: string) =>
    httpClient
      .post("/auth/login", { email, password })
      .then(authResponseSchema.parse),
  me: () => httpClient.get("/auth/me").then(userSchema.parse),
};
