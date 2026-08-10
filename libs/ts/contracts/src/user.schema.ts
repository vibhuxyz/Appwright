import z from "zod";

export const SignupRequest = z.object({
  name: z.string().optional(),
  email: z.email(),
  password: z.string().min(5, "Min 5 digits is required"),
});

export const SigninRequest = z.object({
  email: z.email(),
  password: z.string().min(5, "Min 5 digits is required"),
});

export const SigninResponse = z.object({
  jwtToken: z.string(),
});

export type SignupRequest = z.infer<typeof SignupRequest>;
export type SigninRequest = z.infer<typeof SigninRequest>;
export type SigninResponse = z.infer<typeof SigninResponse>;
