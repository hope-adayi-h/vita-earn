"use client";

import { useState } from "react";
import type { AlternativePaymentUserView } from "@/lib/data/alternative-payment-store";
import {
  ExternalLink,
  Mail,
  Copy,
  Check,
  ShieldCheck,
  Info,
  ArrowRight,
} from "lucide-react";

interface AlternativePaymentButtonProps {
  config: AlternativePaymentUserView | null;
  username?: string;
  className?: string;
}

export function AlternativePaymentButton({
  config,
  username = "Utilisateur",
  className = "",
}: AlternativePaymentButtonProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Si pas de configuration ou inéligible, ne rien afficher, pas même un espace vide
  if (!config || !config.paymentUrl) {
    return null;
  }

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    if (config.email) {
      navigator.clipboard.writeText(config.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const mailtoSubject = encodeURIComponent(`Capture de paiement - ${username}`);
  const mailtoBody = encodeURIComponent(
    `Bonjour l'équipe Vita Earn,\n\nJe viens d'effectuer mon paiement via le lien alternatif pour mon compte @${username}.\nVeuillez trouver ci-joint ma capture d'écran de transaction.\n\nCordialement,\n${username}`
  );
  const mailtoUrl = config.email
    ? `mailto:${config.email}?subject=${mailtoSubject}&body=${mailtoBody}`
    : "#";

  return (
    <div className={`mt-5 pt-5 border-t border-gray-100 dark:border-[#1E2E24] space-y-3.5 ${className}`}>
      {/* 1. Bouton de paiement alternatif (ouvre dans un nouvel onglet) */}
      <a
        href={config.paymentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full touch-target min-h-[48px] rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-sm py-3.5 px-4 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
      >
        <span>{config.buttonLabel || "Payer via un lien alternatif"}</span>
        <ExternalLink className="w-4 h-4 text-sky-100 shrink-0" />
      </a>

      {/* 2. Message affiché aux utilisateurs */}
      {config.userMessage && (
        <div className="flex items-start gap-2 text-xs text-sky-950 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-xl p-3">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">{config.userMessage}</p>
        </div>
      )}

      {/* 3. Bloc Après Paiement */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
            Instructions après paiement
          </h4>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          {config.postPaymentInstructions ||
            "Après ton paiement, envoie la capture d'écran de ta transaction à l'adresse ci-dessous. Ton compte sera activé après vérification."}
        </p>

        {/* Canal officiel unique : E-mail */}
        {config.email && (
          <div className="pt-2 border-t border-gray-200 dark:border-[#1E2E24] space-y-2">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-gray-400">E-mail officiel de réception</p>
                  <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                    {config.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="touch-target px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Copier l'e-mail"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            <a
              href={mailtoUrl}
              className="w-full touch-target min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm py-2.5 px-4 flex items-center justify-center gap-2 shadow-2xs transition-all"
            >
              <Mail className="w-4 h-4 text-white shrink-0" />
              <span>Envoyer ma capture à cet e-mail</span>
              <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
