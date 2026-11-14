import { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";

export function getPaymentProvider(name?: string): PaymentProvider {
  const providerName = name || process.env.PAYMENT_PROVIDER || "mock";

  switch (providerName.toLowerCase()) {
    case "mock":
      return new MockPaymentProvider();
    default:
      // Les agrégateurs réels (CinetPay, FedaPay, PayDunya, Flutterwave)
      // seront intégrés ultérieurement
      return new MockPaymentProvider();
  }
}

export * from "./types";
export * from "./mock";
