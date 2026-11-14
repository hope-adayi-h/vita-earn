import { getActivationData } from "./actions";
import { ActivationClient } from "./ActivationClient";

export const metadata = {
  title: "Activation du compte — Vita Earn",
  description: "Activez votre compte pour vendre et retirer vos gains Mobile Money sur Vita Earn.",
};

export default async function ActivationPage() {
  const data = await getActivationData();

  return <ActivationClient initialData={data} />;
}
