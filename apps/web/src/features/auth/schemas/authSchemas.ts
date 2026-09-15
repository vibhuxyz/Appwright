import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  credits: z.number(),
});
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const credentialsFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
export type CredentialsForm = z.infer<typeof credentialsFormSchema>;
