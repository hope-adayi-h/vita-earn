"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import { reviewWithdrawalAction } from "../actions";
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
  Copy,
  Check,
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

/**
 * Supprime systématiquement tout indicatif international (+228, +229, +225, etc.)
 * pour n'afficher et ne copier que les chiffres locaux prêts pour l'envoi Mobile Money
 */
export function stripCountryPrefix(phone: string): string {
  if (!phone) return "";
  let digits = phone.trim().replace(/[\s\-\(\)\.]/g, "");

  // Retirer les préfixes internationaux avec + ou 00
  digits = digits.replace(/^(\+|00)(228|225|229|221|226|227|223|237|224|241|242|243|33|234|233|254|250)/, "");

  // Retirer les préfixes si saisis directement sans le +
  if (/^228[79]\d{7}$/.test(digits)) digits = digits.slice(3);
  else if (/^225\d{10}$/.test(digits)) digits = digits.slice(3);
  else if (/^229[4569]\d{7}$/.test(digits)) digits = digits.slice(3);
  else if (/^221[7]\d{8}$/.test(digits)) digits = digits.slice(3);
  else if (/^226[567]\d{7}$/.test(digits)) digits = digits.slice(3);
  else if (/^237[6]\d{8}$/.test(digits)) digits = digits.slice(3);

  // Retirer tout '+' résiduel
  digits = digits.replace(/^\+/, "");

  return digits;
}

export function RetraitsClient({ initialWithdrawals }: RetraitsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMotive, setRejectMotive] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filtered = initialWithdrawals.filter((w) => {
    if (filter === "all") return true;
    return w.status === filter;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

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

  const getStatusBadge = (status: WithdrawalAdminItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            En attente
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            En cours
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approuvé
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-100" />
            Retrait validé & payé
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
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
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Onglets de filtre */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {[
          { key: "all", label: "Tous" },
          { key: "pending", label: "En attente" },
          { key: "processing", label: "En cours" },
          { key: "paid", label: "Payés" },
          { key: "rejected", label: "Refusés" },
        ].map((tab) => {
          const count =
            tab.key === "all"
              ? initialWithdrawals.length
              : initialWithdrawals.filter((w) => w.status === tab.key).length;
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-vita-deep text-white shadow-sm"
                  : "bg-white text-vita-muted hover:text-vita-text border border-vita-border hover:bg-vita-surface"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-vita-surface text-vita-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste des demandes */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-vita-border p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-vita-surface text-vita-muted flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-vita-text">Aucune demande de retrait</h3>
          <p className="text-xs text-vita-muted">
            Il n&apos;y a actuellement aucune demande de retrait correspondant à ce filtre.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((w) => {
            const isLoading = loadingId === w.id;
            const isRejecting = rejectingId === w.id;

            // RÈGLE CLIENT : Frais fixes stricts à 500 FCFA pour tous les montants
            const fixedFee = 500;
            const netToPay = Math.max(0, Number(w.amount) - fixedFee);
            const cleanPhone = stripCountryPrefix(w.phoneNumber);
            const beneficiaryName = (w.accountName || w.userName || "Bénéficiaire").trim();

            const copyAllText = `Nom: ${beneficiaryName} | Numéro: ${cleanPhone} | Montant net: ${netToPay} FCFA`;

            return (
              <div
                key={w.id}
                className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* 1. En-tête : Opérateur + Statut + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vita-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <OperatorLogo operatorId={w.paymentMethod} className="w-10 h-10" />
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm sm:text-base capitalize">
                        Retrait {w.paymentMethod}
                      </h4>
                      <span className="text-[11px] text-gray-500 font-medium">
                        Soumis le {new Date(w.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(w.status)}
                  </div>
                </div>

                {/* 2. BLOC DES MONTANTS : GRAND, CLAIR ET BIEN AFFICHÉ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-200">
                    <div>
                      <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Montant demandé par l&apos;utilisateur :
                      </span>
                      <span className="text-lg sm:text-xl font-black text-gray-900">
                        {formatFCFA(w.amount)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                        Frais de retrait fixes :
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-amber-700">
                        - 500 FCFA
                      </span>
                    </div>
                  </div>

                  {/* MONTANT NET RESTANT À ENVOYER (TRÈS GRAND) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div>
                      <span className="block text-xs font-black text-emerald-900 uppercase tracking-wider">
                        Montant net à envoyer au bénéficiaire :
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                        {formatFCFA(netToPay)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(String(netToPay), `amount_${w.id}`)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                        title="Copier le montant net pour votre application de transfert"
                      >
                        {copiedKey === `amount_${w.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-emerald-700 font-extrabold">Montant copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Copier le montant ({netToPay})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. COORDONNÉES DU BÉNÉFICIAIRE (AVEC BOUTONS COPIER ET SANS INDICATIF) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Nom du bénéficiaire */}
                  <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-700">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase">
                          Nom du Titulaire
                        </span>
                        <span className="font-extrabold text-gray-900 truncate block">
                          {beneficiaryName}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(beneficiaryName, `name_${w.id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0"
                      title="Copier le nom complet"
                    >
                      {copiedKey === `name_${w.id}` ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Numéro Mobile Money sans indicatif (+228, +229, etc. supprimés) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase">
                          Numéro Mobile Money (Sans indicatif)
                        </span>
                        <span className="font-mono text-base font-black text-gray-900 tracking-wide truncate block">
                          {cleanPhone}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(cleanPhone, `phone_${w.id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                      title="Copier le numéro prêt à coller"
                    >
                      {copiedKey === `phone_${w.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bouton rapide "Tout copier" */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                  <span>Opération manuelle : copiez les données pour envoyer les fonds via votre opérateur.</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(copyAllText, `all_${w.id}`)}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    {copiedKey === `all_${w.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Récapitulatif copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Tout copier (Nom, Numéro, Net)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Motif admin si existant */}
                {w.adminNote && (
                  <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-700 border border-gray-200">
                    <strong className="text-gray-900 font-bold">Note administrative :</strong>{" "}
                    {w.adminNote}
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
                      className="w-full text-xs p-2.5 rounded-xl border border-red-300 bg-white text-gray-900 focus:outline-hidden"
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
                        className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. BOUTONS D'ACTIONS ADMINISTRATIVES */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5 justify-end border-t border-gray-200">
                  {w.status !== "paid" && w.status !== "rejected" && (
                    <>
                      {/* BOUTON PRINCIPAL : VALIDATION MANUELLE DU RETRAIT */}
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = confirm(
                            `VALIDATION DU RETRAIT :\n\n` +
                            `• Bénéficiaire : ${beneficiaryName}\n` +
                            `• Numéro : ${cleanPhone}\n` +
                            `• Montant envoyé : ${formatFCFA(netToPay)}\n\n` +
                            `Confirmez-vous avoir envoyé les fonds et valider définitivement ce retrait ?`
                          );
                          if (confirmed) {
                            handleAction(
                              w.id,
                              "paid",
                              `Transfert Mobile Money de ${formatFCFA(netToPay)} effectué par l'administrateur au numéro ${cleanPhone}`
                            );
                          }
                        }}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                        )}
                        <span>Valider le retrait</span>
                      </button>

                      {w.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleAction(w.id, "processing")}
                          disabled={isLoading}
                          className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all"
                        >
                          Passer en cours
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setRejectingId(w.id)}
                        disabled={isLoading}
                        className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-all"
                      >
                        Refuser (Restituer les fonds)
                      </button>
                    </>
                  )}

                  {w.status === "paid" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Retrait transféré et validé par l&apos;administrateur</span>
                    </div>
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
