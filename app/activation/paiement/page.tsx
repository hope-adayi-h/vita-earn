import { getActivationData } from "../actions";
import { PaiementClient } from "./PaiementClient";
import { resolveAlternativePaymentForUser } from "@/lib/data/alternative-payment-store";
import { getAutoPaymentCountrySettings } from "@/lib/data/auto-payment-countries-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paiement de l'adhésion — Vita Earn",
  description: "Réglez vos frais d'adhésion par Mobile Money pour activer votre compte vendeur Vita Earn.",
};

export default async function PaiementPage() {
  const data = await getActivationData();

  // Décision strictement prise côté serveur selon le pays du profil enregistré
  const alternativePayment = await resolveAlternativePaymentForUser(data.user.country);
  const autoPaymentSettings = await getAutoPaymentCountrySettings();

  return (
    <PaiementClient
      initialData={data}
      alternativePayment={alternativePayment}
      autoPaymentSettings={autoPaymentSettings}
    />
  );
}
