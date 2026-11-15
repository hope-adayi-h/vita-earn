import { Suspense } from "react";
import { getWithdrawalData } from "./actions";
import { WithdrawalClient } from "./WithdrawalClient";

export const metadata = {
  title: "Demande de Retrait Mobile Money — Vita Earn",
  description: "Retirez vos gains Mobile Money en direct vers T-Money, Moov Flooz et Wave.",
};

export default async function RetraitPage() {
  const data = await getWithdrawalData();

  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-12 text-center text-xs text-vita-muted">
          Chargement du centre de retrait...
        </div>
      }
    >
      <WithdrawalClient initialData={data} />
    </Suspense>
  );
}
