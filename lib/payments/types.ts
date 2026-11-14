export type PaymentPurpose = "activation" | "order_payment";
export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled";

export interface CreatePaymentParams {
  userId: string;
  amount: number; // en FCFA (entier sans décimales)
  currency: string; // 'XOF'
  purpose: PaymentPurpose;
  idempotencyKey: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  paymentId: string;
  provider: string;
  providerRef: string;
  checkoutUrl?: string;
  status: PaymentStatus;
  message?: string;
}

export interface VerifyPaymentResult {
  status: PaymentStatus;
  providerRef: string;
  amount?: number;
  rawResponse?: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  /**
   * Initialise un paiement auprès de l'agrégateur
   */
  initiatePayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * Vérifie le statut d'un paiement auprès de l'agrégateur
   */
  verifyPayment(providerRef: string): Promise<VerifyPaymentResult>;
}
