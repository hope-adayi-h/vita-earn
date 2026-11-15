"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck, AlertTriangle } from "lucide-react";

interface TermsAccordionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function TermsAccordion({ checked, onChange, error }: TermsAccordionProps) {
  // Fermé par défaut selon la demande utilisateur (s'ouvre si l'utilisateur clique)
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Cadre accordéon rétractable des Conditions Générales */}
      <div className="rounded-2xl border border-vita-border bg-white shadow-sm overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-vita-surface/40 hover:bg-vita-surface/80 flex items-center justify-between text-left transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-vita-deep" />
            <span className="font-bold text-xs sm:text-sm text-vita-text">
              Lire les conditions générales
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-vita-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-vita-deep" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="p-4 sm:p-5 space-y-3.5 text-xs text-vita-text/90 leading-relaxed border-t border-vita-border/60 animate-fadeIn">
            {/* Boîte d'avertissement avec alertes rouges */}
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 font-medium flex items-start gap-2.5 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-[13px] leading-snug">
                <strong className="font-bold text-amber-900">Attention :</strong> les fonds
                versés pour l'activation de votre compte ne seront plus retirables.
              </p>
            </div>

            {/* Paragraphe 1 : Utilisation loyale & Anti-fraude */}
            <p>
              En créant un compte sur <strong>Vita Earn</strong>, vous acceptez de
              promouvoir et d'utiliser la plateforme de manière loyale et conforme à la loi.
              Toute utilisation frauduleuse, spam ou création de faux comptes entraîne la
              suspension immédiate du compte et l'annulation des commissions ou gains.
            </p>

            {/* Paragraphe 2 : Calcul et validation des commissions */}
            <p>
              Les commissions et gains de vente sont calculés selon les règles de la
              plateforme en vigueur et versés après validation des ventes. Vita Earn se
              réserve le droit de modifier les taux de commission avec un préavis raisonnable.
            </p>

            {/* Paragraphe 3 : Confidentialité & Sécurité des données */}
            <p>
              Vous êtes seul responsable de la confidentialité de vos identifiants. Les
              données collectées lors de l'inscription sont chiffrées et utilisées
              uniquement pour la gestion, la sécurité de votre compte et le bon déroulement
              de vos opérations financières.
            </p>

            {/* Paragraphe 4 : Majorité légale (18 ans et plus) */}
            <p>
              Cette plateforme est strictement réservée aux personnes majeures (
              <strong>18 ans et plus</strong>) résidant dans un pays où la vente en ligne et
              l'utilisation des services financiers Mobile Money sont autorisées.
            </p>

            {/* Paragraphe 5 : Transparence et sécurité du grand livre */}
            <p className="text-[11px] text-vita-muted pt-1 border-t border-vita-border/50 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-vita-medium flex-shrink-0" />
              <span>
                <em>Sécurité renforcée :</em> Vita Earn applique un grand livre financier
                immuable garantissant la traçabilité intégrale et la protection inviolable de
                chacune de vos transactions.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Case à cocher d'acceptation obligatoire */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            required
            className="mt-0.5 w-4 h-4 rounded border-vita-border text-vita-deep focus:ring-vita-medium accent-vita-deep cursor-pointer flex-shrink-0"
          />
          <span className="text-xs text-vita-text font-medium leading-normal">
            Je confirme avoir au moins 18 ans et avoir lu, compris et accepté les
            conditions générales ci-dessus.
          </span>
        </label>
        {error && <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>}
      </div>
    </div>
  );
}
