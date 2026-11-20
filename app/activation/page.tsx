import { getActivationData } from "./actions";
import { ActivationClient } from "./ActivationClient";
import { resolveAlternativePaymentForUser } from "@/lib/data/alternative-payment-store";
import { getAutoPaymentCountrySettings } from "@/lib/data/auto-payment-countries-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activation du compte — Vita Earn",
  description: "Activez votre compte pour vendre et retirer vos gains Mobile Money sur Vita Earn.",
};

export default async function ActivationPage() {
  const data = await getActivationData();
  const alternativePayment = await resolveAlternativePaymentForUser(data.user.country);
  const autoPaymentSettings = await getAutoPaymentCountrySettings();

  return (
    <ActivationClient
      initialData={data}
      alternativePayment={alternativePayment}
      autoPaymentSettings={autoPaymentSettings}
    />
  );
}
