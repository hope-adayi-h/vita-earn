import { PaymentProvider, CreatePaymentParams, CreatePaymentResult, VerifyPaymentResult } from "./types";
import { SasPayClient } from "./saspay";

export class SasPayPaymentProvider implements PaymentProvider {
  readonly name = "saspay";
  private client: SasPayClient;

  constructor() {
    this.client = new SasPayClient();
  }

  async initiatePayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vita-earn.netlify.app").replace(/\/+$/, "");
    const returnUrl = `${appUrl}/activation/callback`;

    // Si SasPay n'est pas configuré, basculer sur un retour élégant
    if (!this.client.isConfigured()) {
      const mockRef = `sas_mock_${Date.now()}`;
      return {
        paymentId: "",
        provider: this.name,
        providerRef: mockRef,
        checkoutUrl: `/activation?mock_ref=${mockRef}`,
        status: "pending",
        message: "SasPay en attente de clés API.",
      };
    }

    const res = await this.client.createCheckoutSession({
      amount: params.amount,
      currency: params.currency || "XOF",
      description: `Activation compte VitaEarn #${params.userId.substring(0, 8)}`,
      customerEmail: params.customerEmail || "client@vitaearn.com",
      customerName: params.customerName || "Client VitaEarn",
      customerPhone: params.customerPhone,
      returnUrl,
      metadata: {
        userId: params.userId,
        purpose: params.purpose,
        idempotencyKey: params.idempotencyKey,
      },
    });

    if (!res.success || !res.checkoutUrl) {
      return {
        paymentId: "",
        provider: this.name,
        providerRef: "",
        status: "failed",
        message: res.error || "Impossible d'initialiser le paiement SasPay.",
      };
    }

    return {
      paymentId: "",
      provider: this.name,
      providerRef: res.sessionId || "",
      checkoutUrl: res.checkoutUrl,
      status: "pending",
      message: "Session de paiement SasPay créée avec succès.",
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    if (!this.client.isConfigured()) {
      return {
        status: providerRef.startsWith("sas_mock_") ? "succeeded" : "failed",
        providerRef,
        rawResponse: { simulated: true },
      };
    }

    const res = await this.client.verifyPayment(providerRef);

    let mappedStatus: VerifyPaymentResult["status"] = "pending";
    if (res.status === "SUCCESS") mappedStatus = "succeeded";
    else if (res.status === "FAILED") mappedStatus = "failed";
    else if (res.status === "CANCELLED") mappedStatus = "cancelled";

    return {
      status: mappedStatus,
      providerRef,
      amount: res.amount,
      rawResponse: res.raw,
    };
  }
}
