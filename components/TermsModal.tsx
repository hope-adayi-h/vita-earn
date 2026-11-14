"use client";

import { useEffect } from "react";
import { X, ShieldCheck, FileText } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-vita-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-vita-border flex items-center justify-between bg-vita-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-vita-deep/10 text-vita-deep flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-vita-deep">
                Conditions Générales d'Utilisation
              </h3>
              <p className="text-[11px] text-vita-muted">
                Vita Earn — Plateforme web officielle (Togo & Sous-région)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-vita-muted hover:text-vita-text hover:bg-vita-surface transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des conditions */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-vita-text/90 leading-relaxed">
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-900 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
            <p>
              Bienvenue sur Vita Earn. Veuillez prendre connaissance des termes régissant
              votre compte, vos transactions financières et l'utilisation de nos services.
            </p>
          </div>

          <section className="space-y-1.5">
            <h4 className="font-bold text-vita-deep text-xs uppercase tracking-wider">
              1. Objet de la plateforme
            </h4>
            <p>
              Vita Earn est une place de marché numérique permettant l'achat et la vente de
              produits physiques et de ressources digitales en Afrique de l'Ouest, avec
              encaissement et retraits par Mobile Money (T-Money, Moov Flooz).
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-vita-deep text-xs uppercase tracking-wider">
              2. Inscription & Sécurité du compte
            </h4>
            <p>
              L'utilisateur s'engage à fournir des informations exactes lors de son inscription
              (nom d'utilisateur unique, adresse e-mail vérifiable et numéro de téléphone actif).
              Chaque utilisateur est seul responsable de la confidentialité de ses identifiants
              de connexion.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-vita-deep text-xs uppercase tracking-wider">
              3. Activation du compte & Grand livre financier
            </h4>
            <p>
              L'activation du compte donne accès aux fonctions vendeur et aux retraits de solde.
              Toutes les transactions financières sont enregistrées de façon immuable dans le
              grand livre de la plateforme, garantissant la traçabilité intégrale des fonds.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-vita-deep text-xs uppercase tracking-wider">
              4. Politique Anti-Pyramide & Transparence
            </h4>
            <p>
              Vita Earn interdit formellement les systèmes de parrainage à gains multiniveaux
              (MLM pyramidaux). Aucun gain n'est promis sur le recrutement de membres. Les gains
              proviennent exclusivement de la vente légitime de biens et de services.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-vita-deep text-xs uppercase tracking-wider">
              5. Protection des données personnelles
            </h4>
            <p>
              Vos informations personnelles et numéros de téléphone sont chiffrés et traités
              dans le strict respect des normes en vigueur. Elles ne sont jamais revendues ni
              cédées à des tiers à des fins publicitaires.
            </p>
          </section>
        </div>

        {/* Footer Modal avec actions */}
        <div className="px-6 py-3.5 border-t border-vita-border bg-vita-surface/40 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-vita-muted hover:text-vita-text transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="touch-target px-5 py-2 rounded-xl bg-vita-deep hover:bg-vita-medium text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-vita-bright" />
            <span>J'ai lu et j'accepte</span>
          </button>
        </div>
      </div>
    </div>
  );
}
