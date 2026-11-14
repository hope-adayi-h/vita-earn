import { z } from "zod";

export const initiateActivationSchema = z.object({
  provider: z.enum(["mock", "cinetpay", "fedapay", "paydunya", "flutterwave"]).default("mock"),
  paymentMethod: z.enum(["tmoney", "flooz", "card", "mock"]).default("mock"),
});

export const confirmMockPaymentSchema = z.object({
  paymentId: z.string().uuid("Identifiant de paiement invalide."),
});

export type InitiateActivationInput = z.infer<typeof initiateActivationSchema>;
export type ConfirmMockPaymentInput = z.infer<typeof confirmMockPaymentSchema>;
