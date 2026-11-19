"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import { reviewWithdrawalAction, triggerSasPayPayoutAction } from "../actions";
import { OperatorLogo } from "@/components/OperatorLogo";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Hourglass,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Phone,
  User,
  Filter,
  Send,
  Zap,
} from "lucide-react";

export interface WithdrawalAdminItem {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  phoneNumber: string;
  accountName: string;
  status: "pending" | "processing" | "approved" | "rejected" | "paid";
  adminNote?: string | null;
  payoutRef?: string | null;
  payoutProvider?: string | null;
  createdAt: string;
}

interface RetraitsClientProps {
  initialWithdrawals: WithdrawalAdminItem[];
}

export function RetraitsClient({ initialWithdrawals }: RetraitsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMotive, setRejectMotive] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = initialWithdrawals.filter((w) => {
    if (filter === "all") return true;
    return w.status === filter;
  });

  const handleAction = async (
    id: string,
    action: "approve" | "processing" | "reject" | "paid",
    notes?: string
  ) => {
    setLoadingId(id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await reviewWithdrawalAction({
        withdrawalId: id,
        action,
        notes,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.message || "Action enregistrée !");
        setRejectingId(null);
        setRejectMotive("");
        router.refresh();
      }
    } catch {
      setErrorMsg("Une erreur est survenue lors de l'opération.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSasPayPayout = async (w: WithdrawalAdminItem) => {
    const fee5 = Math.round(w.amount * 0.05);
    const net = w.netAmount || (w.amount - fee5);

    const confirmed = confirm(
      `DÉCLENCHEMENT DU VIREMENT MOBILE MONEY SASPAY :\n\n` +
      `• Bénéficiaire : ${w.accountName || w.userName}\n` +
      `• Numéro : ${w.phoneNumber} (${w.paymentMethod})\n` +
      `• Montant brut demandé : ${formatFCFA(w.amount)}\n` +
      `• Frais de retrait 5% : - ${formatFCFA(fee5)}\n` +
      `• Montant net viré : ${formatFCFA(net)}\n\n` +
      `Confirmez-vous la validation et le transfert automatique des fonds via SasPay ?`
    );

    if (!confirmed) return;

    setLoadingId(w.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await triggerSasPayPayoutAction(w.id);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.message || "Virement Mobile Money validé et envoyé via SasPay !");
        router.refresh();
      }
    } catch {
      setErrorMsg("Une erreur est survenue lors de l'appel à SasPay.");
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status: WithdrawalAdminItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            En attente
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            En traitement
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approuvé
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-300">
            <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
            Payé
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Refusé (Fonds restitués)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertes messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Onglets de filtre */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {[
          { key: "all", label: "Tous" },
          { key: "pending", label: "En attente" },
          { key: "processing", label: "En traitement" },
          { key: "approved", label: "Approuvés" },
          { key: "paid", label: "Payés" },
          { key: "rejected", label: "Refusés" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab.key
                ? "bg-vita-deep text-white shadow-sm"
                : "bg-white border border-vita-border text-vita-muted hover:text-vita-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste des demandes */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-vita-border p-10 text-center text-xs text-vita-muted">
          Aucune demande de retrait correspondant à ce filtre.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((w) => {
            const isLoading = loadingId === w.id;
            const isRejecting = rejectingId === w.id;

            return (
              <div
                key={w.id}
                className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* En-tête de carte */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vita-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <OperatorLogo operatorId={w.paymentMethod} className="w-10 h-10" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-vita-deep text-sm sm:text-base">
                          {formatFCFA(w.amount)}
                        </span>
                        <span className="text-[11px] font-bold text-vita-muted uppercase">
                          ({w.paymentMethod})
                        </span>
                      </div>
                      <span className="text-xs text-vita-muted block">
                        Net à verser :{" "}
                        <strong className="text-emerald-700 font-bold">
                          {formatFCFA(w.netAmount)}
                        </strong>{" "}
                        (Frais 5% : {formatFCFA(w.fee || Math.round(w.amount * 0.05))})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(w.status)}
                    <span className="text-[11px] text-vita-muted">
                      {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                {/* Coordonnées du bénéficiaire */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-vita-surface border border-vita-border/70 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-vita-deep flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-vita-muted font-bold uppercase">
                        Bénéficiaire
                      </span>
                      <span className="font-bold text-vita-text truncate block">
                        {w.accountName} ({w.userName})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-vita-surface border border-vita-border/70 flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-vita-deep flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-vita-muted font-bold uppercase">
                        Numéro Mobile Money
                      </span>
                      <span className="font-bold font-mono text-vita-text truncate block">
                        {w.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Motif admin si existant */}
                {w.adminNote && (
                  <div className="p-3 rounded-xl bg-vita-surface text-xs text-vita-text border border-vita-border">
                    <strong className="text-vita-deep font-bold">Note administrative :</strong>{" "}
                    {w.adminNote}
                  </div>
                )}

                {/* Référence de virement SasPay si existante */}
                {w.payoutRef && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-900 border border-emerald-200 flex items-center justify-between">
                    <span className="font-semibold">Reçu / Référence SasPay :</span>
                    <span className="font-mono font-bold text-emerald-800">{w.payoutRef}</span>
                  </div>
                )}

                {/* Zone de refus avec motif */}
                {isRejecting && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-fadeIn">
                    <h4 className="text-xs font-bold text-red-900">
                      Motif du refus (restitution immédiate des fonds dans le portefeuille) :
                    </h4>
                    <input
                      type="text"
                      value={rejectMotive}
                      onChange={(e) => setRejectMotive(e.target.value)}
                      placeholder="Ex : Numéro non enregistré sur le service Mobile Money"
                      className="w-full text-xs p-2.5 rounded-xl border border-red-300 bg-white text-vita-text focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(w.id, "reject", rejectMotive)}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                      >
                        Confirmer le refus & Restituer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectMotive("");
                        }}
                        className="px-4 py-2 rounded-xl bg-white border border-vita-border text-vita-text font-bold text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Boutons d'actions administratives */}
                <div className="pt-2 flex flex-wrap items-center gap-2 justify-end border-t border-vita-border/60">
                  {w.status !== "paid" && w.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleSasPayPayout(w)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                      title="Valider et déclencher le transfert Mobile Money automatique via SasPay"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      )}
                      <span>Valider & Envoyer via SasPay</span>
                    </button>
                  )}

                  {w.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(w.id, "processing")}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all"
                      >
                        Passer en traitement
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(w.id, "approve")}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all"
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(w.id)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-all"
                      >
                        Refuser (avec motif)
                      </button>
                    </>
                  )}

                  {w.status === "processing" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(w.id, "approve")}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all"
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(w.id)}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-all"
                      >
                        Refuser
                      </button>
                    </>
                  )}

                  {(w.status === "approved" || w.status === "processing") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Confirmez-vous avoir EFFECTIVEMENT transféré ${formatFCFA(
                              w.netAmount
                            )} au numéro ${w.phoneNumber} ? Cette action marque le retrait comme payé sans appeler SasPay.`
                          )
                        ) {
                          handleAction(w.id, "paid", "Transfert Mobile Money validé manuellement par l'administrateur");
                        }
                      }}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-white border border-vita-border text-vita-muted hover:text-vita-text text-[11px] font-semibold transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-vita-medium" />
                      <span>Marquer payé manuellement</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
