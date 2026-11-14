import { PaymentProvider, CreatePaymentParams, CreatePaymentResult, VerifyPaymentResult } from "./types";

/**
 * Fournisseur de paiement simulé (MockProvider) pour le développement et le MVP.
 * Permet de tester de bout en bout l'activation de compte sans frais réels.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async initiatePayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const providerRef = `mock_ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      paymentId: "", // Sera mis à jour avec l'ID Supabase
      provider: this.name,
      providerRef,
      checkoutUrl: `/activation?mock_ref=${providerRef}`,
      status: "pending",
      message: "Session de paiement simulé initialisée.",
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    // Dans le simulateur, tout paiement avec un ref mock est validé positivement
    const isValidMock = providerRef.startsWith("mock_ref_");

    return {
      status: isValidMock ? "succeeded" : "failed",
      providerRef,
      rawResponse: {
        mock: true,
        verifiedAt: new Date().toISOString(),
      },
    };
  }
}
