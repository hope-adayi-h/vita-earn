"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import type { WithdrawalPageData } from "./actions";
import { submitWithdrawalAction } from "./actions";
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
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
  solde: {
    title: "Retrait Solde (Solde Principal)",
    badge: "Retrait Solde",
    description: "Retrait direct de votre solde disponible vers votre numéro Mobile Money.",
    icon: Wallet,
    accentColor: "from-[#16A34A] via-[#16A34A] to-[#15803D]",
  },
  total: {
    title: "Retrait Solde (Solde Principal)",
    badge: "Retrait Solde",
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
  const currentTypeKey = searchParams.get("type") || "solde";
  const currentType = WITHDRAWAL_TYPES_CONFIG[currentTypeKey] || WITHDRAWAL_TYPES_CONFIG.solde;
  const TypeIcon = currentType.icon;

  const [operator, setOperator] = useState<string>("");
  const [amount, setAmount] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successResult, setSuccessResult] = useState<{
    reference: string;
    amount: number;
    netAmount: number;
    fee: number;
    operator: string;
    phone: string;
  } | null>(null);

  const availableBalance = initialData.balance;
  const isActivated = initialData.user.isActivated;

  // Récupération dynamique et prioritaire du vrai numéro d'inscription
  const [actualPhone, setActualPhone] = useState<string>(
    initialData.user.phone && initialData.user.phone !== "+228 90 00 00 00"
      ? initialData.user.phone
      : ""
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vita_registered_phone");
      if (stored) {
        setActualPhone(stored);
      } else if (initialData.user.phone) {
        setActualPhone(initialData.user.phone);
      }
    } catch {
      if (initialData.user.phone) {
        setActualPhone(initialData.user.phone);
      }
    }
  }, [initialData.user.phone]);

  const registeredPhone = actualPhone || initialData.user.phone || "+228 90 00 00 00";
  const registeredName = initialData.user.fullName || initialData.user.username || "Titulaire";

  const numAmount = typeof amount === "number" ? amount : 0;
  const withdrawalFee = 500;
  const netAmountCalculated = Math.max(0, numAmount - withdrawalFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!operator || operator === "") {
      setErrorMsg("Veuillez sélectionner ton moyen de paiement.");
      return;
    }

    if (!numAmount || numAmount < 1000) {
      setErrorMsg("Le montant minimum de retrait est de 1 000 FCFA.");
      return;
    }
    if (numAmount > availableBalance) {
      setErrorMsg(`Solde insuffisant (${formatFCFA(availableBalance)} disponibles).`);
      return;
    }

    setIsSubmitting(true);

    try {
      const fullOperatorLabel =
        currentTypeKey !== "total" && currentTypeKey !== "solde"
          ? `${operator} (${currentType.badge})`
          : operator;

      const formData = new FormData();
      formData.set("amount", numAmount.toString());
      formData.set("operator", fullOperatorLabel);
      formData.set("phone", registeredPhone);
      formData.set("accountName", registeredName);

      const res = await submitWithdrawalAction(formData);

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        setSuccessResult({
          reference: "WDR-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          amount: numAmount,
          netAmount: netAmountCalculated,
          fee: withdrawalFee,
          operator: fullOperatorLabel,
          phone: registeredPhone,
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

      {/* 3. AVIS IMPORTANT : COURT, DIRECT ET RASSURANT */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/70 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Avis important :</strong> Le retrait est obligatoirement et automatiquement envoyé vers le numéro enregistré à votre inscription (<strong>{registeredPhone}</strong>) afin de protéger vos gains contre tout détournement en cas de gestion partagée du compte.
        </p>
      </div>

      {/* 4. FORMULAIRE ÉPURÉ : 2 CHAMPS UNIQUEMENT + TABLEAU DES FRAIS DE 500 FCFA */}
      <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-200 dark:border-[#1E2E24] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#1E2E24]">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Effectuer un Retrait
          </h2>
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
            Frais : 500 FCFA
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CHAMP 1 : SÉLECTIONNER TON MOYEN DE PAIEMENT */}
          <div>
            <label htmlFor="operator-select" className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5 block">
              Sélectionner ton moyen de paiement
            </label>
            <div className="relative">
              <select
                id="operator-select"
                value={operator}
                onChange={(e) => {
                  setOperator(e.target.value);
                  setErrorMsg("");
                }}
                className={`w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#17241C] text-xs sm:text-sm font-medium ${
                  operator ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
                } appearance-none focus:outline-hidden focus:border-[#16A34A] pr-9`}
              >
                <option value="" disabled className="text-gray-400">
                  Sélectionner ton moyen de paiement
                </option>
                {OPERATORS.map((op) => (
                  <option key={op.id} value={op.name} className="text-gray-800 dark:text-gray-100">
                    {op.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* CHAMP 2 : ENTRER LE MONTANT */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="amount" className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Entrer le montant
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
                placeholder="Entrer le montant (ex: 5000)"
                required
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#17241C] text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-[#16A34A]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400">
                FCFA
              </span>
            </div>
          </div>

          {/* TABLEAU RÉCAPITULATIF DES FRAIS (500 FCFA FIXES) */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Montant du retrait demandé :</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {numAmount > 0 ? formatFCFA(numAmount) : "0 FCFA"}
              </span>
            </div>
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span>Frais de retrait fixes :</span>
              <span className="font-bold">- 500 FCFA</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
              <span>Numéro récepteur sécurisé :</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{registeredPhone}</span>
            </div>
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
              <span>Délai de virement automatique :</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">15 à 30 minutes</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#1E2E24] text-sm font-black">
              <span className="text-gray-900 dark:text-gray-100">Montant net à recevoir :</span>
              <span className="text-emerald-700 dark:text-emerald-400 text-base">
                {numAmount >= 500 ? formatFCFA(netAmountCalculated) : "0 FCFA"}
              </span>
            </div>
          </div>

          {/* BOUTON D'ACTION : PAYER ET FAIRE LE RETRAIT */}
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
                <span>Payer et faire le retrait</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* 5. MODAL SUCCÈS APRÈS RETRAIT */}
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
                Votre demande de retrait de <strong className="text-emerald-600">{formatFCFA(successResult.amount)}</strong> a été transmise vers {successResult.operator}.
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
              <div className="flex justify-between text-amber-700 dark:text-amber-400">
                <span>Frais fixes déduits :</span>
                <span className="font-bold">- 500 FCFA</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold border-t border-gray-200 dark:border-[#1E2E24] pt-1 text-sm">
                <span>Net envoyé sur votre compte :</span>
                <span className="font-black">{formatFCFA(successResult.netAmount)}</span>
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
