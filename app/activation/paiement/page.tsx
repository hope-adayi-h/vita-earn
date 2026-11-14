import { getActivationData } from "../actions";
import { PaiementClient } from "./PaiementClient";

export const metadata = {
  title: "Paiement de l'adhésion — Vita Earn",
  description: "Réglez vos frais d'adhésion par Mobile Money pour activer votre compte vendeur Vita Earn.",
};

export default async function PaiementPage() {
  const data = await getActivationData();

  return <PaiementClient initialData={data} />;
}
