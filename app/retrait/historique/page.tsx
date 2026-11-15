import { getWithdrawalHistory, getWithdrawalData } from "../actions";
import { HistoryClient } from "./HistoryClient";

export const metadata = {
  title: "Historique des Retraits Mobile Money — Vita Earn",
  description: "Consultez l'historique complet de vos retraits Mobile Money.",
};

export default async function HistoriqueRetraitsPage() {
  const history = await getWithdrawalHistory();
  const data = await getWithdrawalData();

  return (
    <HistoryClient
      initialHistory={history}
      totalWithdrawn={data.totalWithdrawn}
    />
  );
}
