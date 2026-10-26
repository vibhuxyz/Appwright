import { z } from "zod";

export const RuntimeTransactionalEmailRequestSchema = z.object({
  to: z.string().email().max(254),
  subject: z.string().trim().min(1).max(200),
  text: z.string().max(30_000).optional(),
  html: z.string().max(30_000).optional(),
}).strict().refine((input) => Boolean(input.text || input.html), {
  message: "Email text or HTML content is required",
});
export type RuntimeTransactionalEmailRequest = z.infer<typeof RuntimeTransactionalEmailRequestSchema>;

export const RuntimeTransactionalEmailResponseSchema = z.object({
  status: z.literal("accepted"),
  provider: z.literal("brevo"),
  messageId: z.string().optional(),
  credentialMode: z.enum(["APPWRITE_MANAGED", "BYOK"]),
});
export type RuntimeTransactionalEmailResponse = z.infer<typeof RuntimeTransactionalEmailResponseSchema>;

export const RuntimeCreateRazorpayOrderRequestSchema = z.object({
  amountMinor: z.string().regex(/^[1-9][0-9]{0,11}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  receipt: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/).optional(),
}).strict();
export type RuntimeCreateRazorpayOrderRequest = z.infer<typeof RuntimeCreateRazorpayOrderRequestSchema>;

export const RuntimeCreateRazorpayOrderResponseSchema = z.object({
  orderId: z.string(),
  amountMinor: z.string(),
  currency: z.string().length(3),
  keyId: z.string(),
  environment: z.enum(["development", "preview", "production"]),
  credentialMode: z.enum(["APPWRITE_MANAGED", "BYOK"]),
});
export type RuntimeCreateRazorpayOrderResponse = z.infer<typeof RuntimeCreateRazorpayOrderResponseSchema>;

export const RuntimeVerifyRazorpayPaymentRequestSchema = z.object({
  orderId: z.string().regex(/^order_[A-Za-z0-9]+$/),
  paymentId: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();
export type RuntimeVerifyRazorpayPaymentRequest = z.infer<typeof RuntimeVerifyRazorpayPaymentRequestSchema>;

export const RuntimePaymentStatusResponseSchema = z.object({
  orderId: z.string(),
  paymentId: z.string().nullable(),
  status: z.enum(["created", "authorized", "captured", "failed"]),
  amountMinor: z.string(),
  currency: z.string(),
});
export type RuntimePaymentStatusResponse = z.infer<typeof RuntimePaymentStatusResponseSchema>;
