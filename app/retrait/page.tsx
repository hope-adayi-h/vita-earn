import { getWithdrawalData } from "./actions";
import { WithdrawalClient } from "./WithdrawalClient";

export const metadata = {
  title: "Demande de Retrait Mobile Money — Vita Earn",
  description: "Retirez vos gains Mobile Money en direct vers T-Money, Moov Flooz et Wave.",
};

export default async function RetraitPage() {
  const data = await getWithdrawalData();

  return <WithdrawalClient initialData={data} />;
}
