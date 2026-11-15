"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import type { WithdrawalPageData } from "./actions";
import { submitWithdrawalAction } from "./actions";
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  PhoneCall,
  Loader2,
  Smartphone,
  ChevronDown,
  Info,
  Video,
  PlaySquare,
  HelpCircle,
  MousePointerClick,
  Camera,
} from "lucide-react";

interface WithdrawalClientProps {
  initialData: WithdrawalPageData;
}

const OPERATORS = [
  { id: "tmoney_tg", name: "T-Money Togo (+228)", country: "Togo" },
  { id: "flooz_tg", name: "Moov Flooz Togo (+228)", country: "Togo" },
  { id: "mtn_bj", name: "MTN MoMo Bénin (+229)", country: "Bénin" },
  { id: "moov_bj", name: "Moov Money Bénin (+229)", country: "Bénin" },
  { id: "orange_ci", name: "Orange Money Côte d'Ivoire (+225)", country: "Côte d'Ivoire" },
  { id: "wave", name: "Wave Sénégal / CI (+221 / +225)", country: "UEMOA" },
  { id: "mtn_cm", name: "MTN MoMo Cameroun (+237)", country: "Cameroun" },
];

const WITHDRAWAL_TYPES_CONFIG: Record<
  string,
  {
    title: string;
    badge: string;
    description: string;
    icon: any;
    accentColor: string;
  }
> = {
  total: {
    title: "Retrait Total (Solde Principal)",
    badge: "Solde Principal & Réseau",
    description: "Retrait direct de votre solde disponible vers votre numéro Mobile Money.",
    icon: Wallet,
    accentColor: "from-[#16A34A] via-[#16A34A] to-[#15803D]",
  },
  tiktok: {
    title: "Retrait des Gains TikTok",
    badge: "Tâche TikTok Vidéos",
    description: "Retrait de vos rémunérations accumulées sur les tâches vidéos TikTok.",
    icon: Video,
    accentColor: "from-[#BE185D] via-[#9D174D] to-[#831843]",
  },
  youtube: {
    title: "Retrait des Gains YouTube",
    badge: "Tâche YouTube Vidéos",
    description: "Retrait de vos gains accumulés sur les formations et vidéos YouTube.",
    icon: PlaySquare,
    accentColor: "from-[#DC2626] via-[#B91C1C] to-[#991B1B]",
  },
  trivia: {
    title: "Retrait des Gains Trivia",
    badge: "Tâche Trivia Questions",
    description: "Retrait de vos récompenses accumulées sur les quiz et questions culturelles.",
    icon: HelpCircle,
    accentColor: "from-[#4F46E5] via-[#4338CA] to-[#3730A3]",
  },
  ads: {
    title: "Retrait des Gains Ads Clics",
    badge: "Tâche Clics Publicitaires",
    description: "Retrait de vos gains accumulés sur les visites d'annonces sponsorisées.",
    icon: MousePointerClick,
    accentColor: "from-[#D97706] via-[#B45309] to-[#92400E]",
  },
  instagram: {
    title: "Retrait des Gains Instagram",
    badge: "Tâche Vidéos Instagram",
    description: "Retrait de vos gains accumulés sur les contenus vidéos Instagram.",
    icon: Camera,
    accentColor: "from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]",
  },
};

export function WithdrawalClient({ initialData }: WithdrawalClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTypeKey = searchParams.get("type") || "total";
  const currentType = WITHDRAWAL_TYPES_CONFIG[currentTypeKey] || WITHDRAWAL_TYPES_CONFIG.total;
  const TypeIcon = currentType.icon;

  const [operator, setOperator] = useState(OPERATORS[0].name);
  const [accountName, setAccountName] = useState(initialData.user.fullName || initialData.user.username || "");
  const [phone, setPhone] = useState(initialData.user.phone || "");
  const [amount, setAmount] = useState<number | "">(initialData.balance > 0 ? Math.min(initialData.balance, 5000) : 2000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successResult, setSuccessResult] = useState<{
    reference: string;
    amount: number;
    operator: string;
    phone: string;
  } | null>(null);

  const availableBalance = initialData.balance;
  const isActivated = initialData.user.isActivated;

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setErrorMsg("");
  };

  const handleAllBalance = () => {
    setAmount(availableBalance);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      setErrorMsg("Le montant minimum de retrait est de 1 000 FCFA.");
      return;
    }
    if (numAmount > availableBalance) {
      setErrorMsg(`Solde insuffisant (${formatFCFA(availableBalance)} disponibles).`);
      return;
    }
    if (!phone || phone.length < 6) {
      setErrorMsg("Veuillez renseigner un numéro de téléphone Mobile Money valide.");
      return;
    }
    if (!accountName || accountName.length < 2) {
      setErrorMsg("Veuillez renseigner le nom complet du titulaire.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullOperatorLabel =
        currentTypeKey !== "total"
          ? `${operator} (${currentType.badge})`
          : operator;

      const formData = new FormData();
      formData.set("amount", numAmount.toString());
      formData.set("operator", fullOperatorLabel);
      formData.set("phone", phone);
      formData.set("accountName", accountName);

      const res = await submitWithdrawalAction(formData);

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        setSuccessResult({
          reference: "WDR-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          amount: numAmount,
          operator: fullOperatorLabel,
          phone,
        });
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg("Une erreur inattendue est survenue.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      {/* 1. EN-TÊTE : SOLDE DISPONIBLE & ACCÈS HISTORIQUE */}
      <div className={`rounded-3xl bg-gradient-to-br ${currentType.accentColor} p-5 sm:p-6 text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur mb-1.5">
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{currentType.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {currentType.title}
            </h1>
            <p className="text-xs text-white/90 mt-0.5">
              {currentType.description}
            </p>
          </div>

          <Link
            href="/retrait/historique"
            className="touch-target px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border border-white/25 shadow-xs"
          >
            <History className="w-4 h-4" />
            <span>Historique</span>
          </Link>
        </div>

        {/* Chiffre du Solde Disponible */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-baseline gap-2">
          <span className="text-xs font-bold text-white/80 uppercase">Solde Disponible :</span>
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatFCFA(availableBalance)}
          </span>
        </div>
      </div>

      {/* 2. ALERTE SI COMPTE NON ACTIVÉ */}
      {!isActivated && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-bold text-sm">Compte en attente d&apos;activation</p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300">
              Pour débloquer les retraits instantanés par T-Money et Flooz, veuillez activer votre adhésion unique de 4 500 FCFA.
            </p>
            <Link
              href="/activation"
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Activer mon compte maintenant</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. FORMULAIRE DE RETRAIT DE A À Z */}
      <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-200 dark:border-[#1E2E24] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1E2E24]">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Paramètres du Retrait
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
            Frais : 0 FCFA (Offerts)
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Opérateur */}
          <div>
            <label htmlFor="operator-select" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
              Opérateur Mobile Money
            </label>
            <div className="relative">
              <select
                id="operator-select"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#17241C] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 appearance-none focus:outline-hidden focus:border-[#16A34A] pr-9"
              >
                {OPERATORS.map((op) => (
                  <option key={op.id} value={op.name}>
                    {op.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Nom du titulaire */}
          <div>
            <label htmlFor="accountName" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
              Nom complet du titulaire du compte
            </label>
            <input
              id="accountName"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Koffi Mensah"
              required
              className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#17241C] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-hidden focus:border-[#16A34A]"
            />
          </div>

          {/* Numéro de téléphone Mobile Money */}
          <div>
            <label htmlFor="phone" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
              Numéro de téléphone récepteur
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +228 90 12 34 56"
                required
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#17241C] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-hidden focus:border-[#16A34A] pl-10"
              />
              <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Montant avec raccourcis */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="amount" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Montant à retirer (FCFA)
              </label>
              <span className="text-[10px] text-gray-500">Min: 1 000 FCFA</span>
            </div>

            <div className="relative">
              <input
                id="amount"
                type="number"
                min={1000}
                max={availableBalance > 0 ? availableBalance : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? parseInt(e.target.value, 10) : "")}
                placeholder="Ex: 5000"
                required
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#17241C] text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-[#16A34A]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">
                XOF
              </span>
            </div>

            {/* Raccourcis de montants */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              {[1000, 2000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                    amount === val
                      ? "bg-[#16A34A] text-white border-[#16A34A]"
                      : "bg-gray-50 dark:bg-[#17241C] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#1E2E24] hover:bg-gray-100"
                  }`}
                >
                  {val.toLocaleString("fr-FR")} F
                </button>
              ))}
              <button
                type="button"
                onClick={handleAllBalance}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors shrink-0"
              >
                Tout retirer
              </button>
            </div>
          </div>

          {/* Récapitulatif du transfert */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Frais de transfert réseau :</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">0 FCFA (Gratuit)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Délai de réception :</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">15 à 30 minutes</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-[#1E2E24] font-bold text-gray-900 dark:text-gray-100 text-sm">
              <span>Montant net à recevoir :</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-black">
                {amount ? formatFCFA(Number(amount)) : "0 FCFA"}
              </span>
            </div>
          </div>

          {/* Bouton de confirmation */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full touch-target rounded-2xl bg-[#16A34A] hover:bg-[#15803D] active:scale-98 text-white font-black text-sm py-3.5 flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-75 disabled:cursor-wait"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Traitement du retrait en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-white" />
                <span>Confirmer le Retrait Mobile Money</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. MODAL SUCCÈS APRÈS RETRAIT */}
      {successResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131E17] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100 dark:border-[#1E2E24] animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                Demande de Retrait Validée !
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Votre retrait de <strong className="text-emerald-600">{formatFCFA(successResult.amount)}</strong> a été transmis au réseau {successResult.operator}.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Référence :</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{successResult.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Numéro récepteur :</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{successResult.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Délai estimé :</span>
                <span className="font-bold text-emerald-600">15 à 30 minutes</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/retrait/historique"
                className="w-full touch-target rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs py-3 text-center transition-colors shadow-xs"
              >
                Voir mon Historique de Retraits
              </Link>
              <Link
                href="/"
                className="w-full touch-target rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs py-2.5 text-center transition-colors"
              >
                Retour au Tableau de Bord
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
