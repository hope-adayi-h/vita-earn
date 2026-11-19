"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import { requestWithdrawalAction } from "@/app/portefeuille/actions";
import { OperatorLogo } from "@/components/OperatorLogo";
import {
  Wallet,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  CreditCard,
  Phone,
  User,
  ShieldCheck,
} from "lucide-react";

interface WithdrawalModalProps {
  availableBalance: number;
}

const OPERATORS = [
  { id: "tmoney", name: "T-Money", country: "Togo" },
  { id: "flooz", name: "Moov Flooz", country: "Togo / Bénin / CI" },
  { id: "wave", name: "Wave", country: "Sénégal / CI" },
  { id: "mtn_momo", name: "MTN MoMo", country: "Bénin / CI / CM" },
  { id: "orange", name: "Orange Money", country: "CI / Sénégal / BF" },
];

export function WithdrawalModal({ availableBalance }: WithdrawalModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(availableBalance >= 2000 ? 2000 : 0);
  const [paymentMethod, setPaymentMethod] = useState("tmoney");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const feePct = 0.05; // 5% de frais de transfert Mobile Money
  const feeAmount = Math.round(amount * feePct);
  const netAmount = Math.max(0, amount - feeAmount);

  const handleQuickAmount = (val: number) => {
    setAmount(Math.min(val, availableBalance));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (amount < 2000) {
      setError("Le montant minimum de retrait est de 2 000 FCFA.");
      return;
    }

    if (amount > availableBalance) {
      setError("Le montant demandé dépasse votre solde disponible.");
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setError("Veuillez renseigner un numéro Mobile Money valide.");
      return;
    }

    if (!accountName || accountName.trim().length < 2) {
      setError("Veuillez renseigner le nom complet du bénéficiaire.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("amount", amount.toString());
      formData.set("paymentMethod", paymentMethod);
      formData.set("phoneNumber", phoneNumber.trim());
      formData.set("accountName", accountName.trim());

      const res = await requestWithdrawalAction(formData);

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.message || "Demande de retrait enregistrée !");
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
          router.refresh();
        }, 1800);
      }
    } catch {
      setError("Une erreur inattendue est survenue lors de la demande de retrait.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setSuccess(null);
          setIsOpen(true);
        }}
        disabled={availableBalance < 2000}
        className="touch-target px-5 py-2.5 rounded-xl bg-vita-bright hover:bg-lime-400 text-vita-deep font-black text-xs sm:text-sm transition-all shadow-md inline-flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
      >
        <CreditCard className="w-4 h-4 text-vita-deep" />
        <span>Demander un retrait</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-vita-border w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            {/* Header du modal */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-vita-deep to-vita-medium text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-vita-bright tracking-wider">
                  Mobile Money Direct
                </span>
                <h2 className="text-lg sm:text-xl font-black">
                  Demande de Retrait
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du formulaire */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Rappel Solde disponible */}
              <div className="p-3.5 rounded-2xl bg-vita-surface border border-vita-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-vita-muted block">
                    Solde disponible pour retrait
                  </span>
                  <span className="text-base font-black text-vita-deep">
                    {formatFCFA(availableBalance)}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Minimum : 2 000 FCFA
                </span>
              </div>

              {/* Messages d'alerte / succès */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Montant */}
                <div>
                  <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
                    Montant à retirer (FCFA)
                  </label>
                  <input
                    type="number"
                    min={2000}
                    max={availableBalance}
                    step={100}
                    value={amount || ""}
                    onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                    required
                    className="w-full touch-target rounded-xl border border-vita-border bg-white px-3 py-2 text-sm font-bold text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                  />

                  {/* Boutons de montants rapides */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[2000, 5000, 10000, 25000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleQuickAmount(v)}
                        disabled={v > availableBalance}
                        className="px-2.5 py-1 rounded-lg border border-vita-border bg-white hover:bg-vita-surface text-[11px] font-semibold text-vita-text disabled:opacity-40"
                      >
                        {v.toLocaleString("fr-FR")} F
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(availableBalance)}
                      className="px-2.5 py-1 rounded-lg border border-vita-deep bg-vita-deep/10 text-[11px] font-bold text-vita-deep"
                    >
                      Tout retirer
                    </button>
                  </div>
                </div>

                {/* 2. Moyen de retrait Mobile Money */}
                <div>
                  <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-2">
                    Opérateur Mobile Money
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATORS.map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setPaymentMethod(op.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                          paymentMethod === op.id
                            ? "border-vita-deep bg-green-50 ring-2 ring-vita-deep"
                            : "border-vita-border bg-white hover:border-vita-medium"
                        }`}
                      >
                        <OperatorLogo operatorId={op.id} className="w-7 h-7 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="block font-bold text-vita-deep truncate text-xs">
                            {op.name}
                          </span>
                          <span className="block text-[10px] text-vita-muted truncate">
                            {op.country}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Numéro de téléphone Mobile Money */}
                <div>
                  <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
                    Numéro de téléphone récepteur
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+228 90 00 00 00"
                      required
                      className="w-full touch-target rounded-xl border border-vita-border bg-white pl-10 pr-3 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                    />
                  </div>
                </div>

                {/* 4. Nom complet du titulaire */}
                <div>
                  <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
                    Nom complet du titulaire du numéro
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Identique au compte Mobile Money"
                      required
                      className="w-full touch-target rounded-xl border border-vita-border bg-white pl-10 pr-3 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                    />
                  </div>
                </div>

                {/* Récapitulatif frais & net à recevoir */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Frais de transfert Mobile Money (5%) :</span>
                    <span className="font-bold">{formatFCFA(feeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black border-t border-amber-200/70 pt-1 text-vita-deep">
                    <span>Montant net versé sur votre compte :</span>
                    <span className="text-emerald-700">{formatFCFA(netAmount)}</span>
                  </div>
                </div>

                {/* Bouton de confirmation */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || amount < 2000 || amount > availableBalance}
                    className="w-full touch-target py-3 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Réservation du montant...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-vita-bright" />
                        <span>Confirmer la demande de {formatFCFA(amount)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
