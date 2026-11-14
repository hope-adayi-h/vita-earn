"use client";

import { useState } from "react";
import {
  HelpCircle,
  X,
  MessageCircle,
  ShieldCheck,
  Wallet,
  CalendarCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mail,
  ExternalLink,
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      question: "Comment activer mon compte Vita Earn ?",
      answer:
        "L'activation du compte se fait via un paiement unique de 4 500 FCFA par Mobile Money (T-Money ou Flooz). Elle vous donne accès à toutes les fonctionnalités : accomplir les tâches quotidiennes rémunérées, publier des articles sur la marketplace, et toucher des commissions de parrainage sur 3 niveaux.",
      icon: ShieldCheck,
    },
    {
      question: "Comment accomplir les tâches quotidiennes (Time Table) ?",
      answer:
        "Chaque jour selon le planning (Lundi : Trivia/Questions, Mardi : TikTok, Mercredi : YouTube, Jeudi : Annonces, Vendredi : Instagram), l'administrateur valide la tâche du jour. En réalisant la tâche avec succès, vos gains sont crédités instantanément sur votre compteur de tâche et versés dans votre solde.",
      icon: CalendarCheck,
    },
    {
      question: "Quand et comment puis-je retirer mes gains ?",
      answer:
        "Le seuil minimum de retrait est de 4 500 FCFA. Dès que votre solde atteint ce montant, vous pouvez demander un retrait vers votre portefeuille Mobile Money (T-Money Togo ou Moov Money Flooz) depuis la section Portefeuille.",
      icon: Wallet,
    },
    {
      question: "Comment fonctionne le programme d'affiliation à 3 niveaux ?",
      answer:
        "Vous gagnez des commissions directes sur chaque activation effectuée via votre lien de parrainage :\n• Niveau 1 (parrainage direct) : 2 000 FCFA\n• Niveau 2 (parrainage second niveau) : 1 000 FCFA\n• Niveau 3 (parrainage troisième niveau) : 500 FCFA\nLes commissions sont inscrites immédiatement dans votre grand livre.",
      icon: Users,
    },
    {
      question: "Besoin d'aide supplémentaire ou d'assistance directe ?",
      answer:
        "Notre équipe de support client est disponible 7 jours sur 7 de 8h00 à 22h00 GMT sur WhatsApp ou par e-mail à support@vitaearn.com pour répondre à toutes vos questions.",
      icon: Headphones,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond obscurci */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Boîte modale */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="p-4 sm:p-5 bg-vita-deep text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Assistance & Centre d'Aide</h2>
              <p className="text-xs text-white/80">Questions fréquentes & Support Vita Earn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canaux d'assistance directe */}
        <div className="p-4 bg-vita-surface border-b border-vita-border/80">
          <p className="text-xs font-bold text-vita-deep uppercase tracking-wider mb-2.5">
            Canaux d'assistance directe
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="https://wa.me/22890000000?text=Bonjour%20Support%20Vita%20Earn,%20j'ai%20besoin%20d'aide."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Assistance WhatsApp</div>
                  <div className="text-[10px] text-white/80">Réponse rapide 7j/7</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href="mailto:support@vitaearn.com"
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-vita-border hover:bg-vita-surface text-vita-deep transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-vita-medium shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Support par Email</div>
                  <div className="text-[10px] text-vita-muted">support@vitaearn.com</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-vita-muted" />
            </a>
          </div>
        </div>

        {/* Liste des questions fréquentes */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          <p className="text-xs font-bold text-vita-deep uppercase tracking-wider mb-2">
            Foire Aux Questions (FAQ)
          </p>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const Icon = faq.icon;
            return (
              <div
                key={faq.question}
                className="border border-vita-border rounded-xl overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-vita-surface/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-vita-medium shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-vita-deep">
                      {faq.question}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-vita-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-vita-muted shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-vita-text leading-relaxed whitespace-pre-line border-t border-vita-border/40 bg-vita-surface/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pied de modal */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-vita-muted">
          <span>Horaires support : 8h00 - 22h00 GMT</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
