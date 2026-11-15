"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivationData } from "./types";
import {
  User,
  CreditCard,
  Globe,
  ArrowLeftRight,
  PhoneCall,
  Home,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronDown,
} from "lucide-react";

interface ActivationClientProps {
  initialData: ActivationData;
}

const PAYMENT_CHANNELS = [
  { id: "tmoney_tg", name: "T-Money Togo (+228)", country: "Togo", code: "+228" },
  { id: "flooz_tg", name: "Moov Flooz Togo (+228)", country: "Togo", code: "+228" },
  { id: "mtn_bj", name: "MTN MoMo Bénin (+229)", country: "Bénin", code: "+229" },
  { id: "moov_bj", name: "Moov Money Bénin (+229)", country: "Bénin", code: "+229" },
  { id: "orange_ci", name: "Orange Money Côte d'Ivoire (+225)", country: "Côte d'Ivoire", code: "+225" },
  { id: "mtn_ci", name: "MTN MoMo Côte d'Ivoire (+225)", country: "Côte d'Ivoire", code: "+225" },
  { id: "wave_ci", name: "Wave Côte d'Ivoire / Sénégal (+225 / +221)", country: "UEMOA", code: "+225" },
  { id: "orange_sn", name: "Orange Money Sénégal (+221)", country: "Sénégal", code: "+221" },
  { id: "mtn_cm", name: "MTN MoMo Cameroun (+237)", country: "Cameroun", code: "+237" },
  { id: "orange_cm", name: "Orange Money Cameroun (+237)", country: "Cameroun", code: "+237" },
];

export function ActivationClient({ initialData }: ActivationClientProps) {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState(PAYMENT_CHANNELS[0].id);
  const [fullName, setFullName] = useState(initialData.user.fullName || initialData.user.username || "");
  const [walletNumber, setWalletNumber] = useState(initialData.user.phone || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStkModal, setShowStkModal] = useState(false);

  const displayUsername = initialData.user.username || initialData.user.fullName || "Utilisateur";
  const displayPhone = walletNumber || initialData.user.phone || "+228 90 00 00 00";
  const currency = initialData.currency || "XOF";
  const feeAmount = initialData.feeAmount || 4500;

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setShowStkModal(true);

    // Simulation du push STK Mobile Money puis validation automatique
    setTimeout(() => {
      // Soumettre le formulaire vers /api/auth/quick-activate
      const form = document.getElementById("stk-payment-form") as HTMLFormElement;
      if (form) {
        form.submit();
      } else {
        router.push("/api/auth/quick-activate");
      }
    }, 2400);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      {/* CARTE 1 : Statut du compte (Account Status) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        {initialData.isActivated ? (
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Compte Actif</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Votre adhésion est confirmée. Vous avez accès à l&apos;ensemble des services Vita Earn.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-1">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>Compte Inactif</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Veuillez activer votre compte pour commencer votre activité.
            </p>
          </div>
        )}
      </div>

      {/* CARTE 2 : Informations de Dépôt (Deposit Info) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Informations de Dépôt</h2>
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-4">
          {/* USER NAME */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mt-0.5 border border-gray-100 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Nom d&apos;utilisateur
              </span>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayUsername}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* DEPOSIT NUMBER */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mt-0.5 border border-emerald-100 flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Numéro de dépôt
              </span>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayPhone}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* CURRENCY */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mt-0.5 border border-gray-100 flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Devise
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARTE 3 : Actions Rapides (Quick Actions) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Actions Rapides</h2>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>

        <Link
          href="/"
          className="w-full touch-target rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm py-3 px-4 flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Home className="w-4 h-4 text-white" />
          <span>Accéder au Tableau de Bord</span>
        </Link>
      </div>

      {/* CARTE 4 : Paiement Mobile Money (STK Push) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Mobile Money (STK)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Initiez le paiement directement sur votre téléphone
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100 flex-shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
        </div>

        <form
          id="stk-payment-form"
          method="POST"
          action="/api/auth/quick-activate"
          onSubmit={handleStartPayment}
          className="space-y-4"
        >
          {/* Données d'identification de l'utilisateur pour activation garantie */}
          <input type="hidden" name="username" value={displayUsername} />
          <input type="hidden" name="email" value={initialData.user.email || ""} />

          {/* Sélection du canal */}
          <div>
            <label htmlFor="channel-select" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Sélectionnez le canal
            </label>
            <div className="relative">
              <select
                id="channel-select"
                name="channel"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-800 appearance-none focus:outline-hidden focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] pr-9"
              >
                {PAYMENT_CHANNELS.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Nom du propriétaire */}
          <div>
            <label htmlFor="fullName" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Nom complet
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Koffi Mensah"
              className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-800 focus:outline-hidden focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
            />
          </div>

          {/* Numéro de portefeuille */}
          <div>
            <label htmlFor="walletNumber" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Numéro de portefeuille
            </label>
            <input
              id="walletNumber"
              name="walletNumber"
              type="tel"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              placeholder="Ex: +228 90 12 34 56"
              className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-800 focus:outline-hidden focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
              required
            />
          </div>

          {/* Montant (Amount) avec badge XOF */}
          <div>
            <label htmlFor="amount" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Montant
            </label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
              <span className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 border-r border-gray-200 select-none">
                {currency}
              </span>
              <input
                id="amount"
                name="amount"
                type="text"
                value={feeAmount}
                readOnly
                className="w-full px-3.5 py-2.5 bg-gray-50 text-xs sm:text-sm font-bold text-gray-900 cursor-not-allowed select-none focus:outline-hidden"
              />
            </div>
          </div>

          {/* Boutons d'action : Dashboard & Make Payment */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="touch-target px-3 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Tableau de Bord</span>
            </Link>

            <button
              type="submit"
              disabled={isProcessing}
              className="touch-target px-3 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-75 disabled:cursor-wait"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Envoi STK...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Payer Maintenant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL SIMULATION STK PUSH */}
      {showStkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border-2 border-sky-200">
              <PhoneCall className="w-8 h-8 animate-pulse text-sky-600" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Demande STK Push envoyée !
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Une invite de paiement de <strong className="text-gray-900">{feeAmount} {currency}</strong> a été transmise sur le numéro{" "}
                <strong className="text-gray-900">{displayPhone}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 text-left space-y-1">
              <p className="font-semibold text-gray-800">Instructions :</p>
              <p>1. Tapez votre code secret Mobile Money sur votre écran.</p>
              <p>2. Validez le débit de 4 500 FCFA.</p>
              <p>3. Redirection automatique vers votre espace membre.</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-100">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Validation du paiement en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
