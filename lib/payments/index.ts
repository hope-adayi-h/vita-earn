import { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";
import { SasPayPaymentProvider } from "./saspay-provider";

export function getPaymentProvider(name?: string): PaymentProvider {
  // Si SASPAY_API_KEY est défini, SasPay est le fournisseur par défaut
  const defaultProvider = process.env.SASPAY_API_KEY ? "saspay" : "mock";
  const providerName = name || process.env.PAYMENT_PROVIDER || defaultProvider;

  switch (providerName.toLowerCase()) {
    case "saspay":
      return new SasPayPaymentProvider();
    case "mock":
    default:
      return new MockPaymentProvider();
  }
}

export * from "./types";
export * from "./mock";
export * from "./saspay";
export * from "./saspay-provider";
