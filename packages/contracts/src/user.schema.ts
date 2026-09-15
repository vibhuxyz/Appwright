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

export const AddCreditsRequest = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
});

export const UserCreditsResponse = z.object({
  credits: z.number().int(),
});

export type SignupRequest = z.infer<typeof SignupRequest>;
export type SigninRequest = z.infer<typeof SigninRequest>;
export type SigninResponse = z.infer<typeof SigninResponse>;
export type AddCreditsRequest = z.infer<typeof AddCreditsRequest>;
export type UserCreditsResponse = z.infer<typeof UserCreditsResponse>;
