"use client";

import { useState, useMemo } from "react";
import {
  HelpCircle,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Wallet,
  CalendarCheck,
  Users,
  Gift,
  Disc,
  ShoppingBag,
  Lock,
} from "lucide-react";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: any;
}

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS_DATA: FaqItem[] = [
  {
    id: "activation",
    category: "Activation du Compte",
    question: "Comment activer mon compte Vita Earn et pourquoi payer 4 500 FCFA ?",
    answer:
      "L'activation du compte nécessite un paiement unique de 4 500 FCFA par Mobile Money (T-Money ou Flooz). Ce forfait d'accès officiel débloque l'intégralité de vos privilèges : accès aux formations professionnelles, publication d'articles sur la marketplace, participation aux tâches rémunérées quotidiennes, tour de bienvenue offert, et perception des commissions de parrainage sur 3 niveaux.",
    icon: ShieldCheck,
  },
  {
    id: "welcome-bonus",
    category: "Récompense de Démarrage",
    question: "Qu'est-ce que la Récompense de Démarrage (900 FCFA) et comment la débloquer ?",
    answer:
      "La Récompense de Démarrage est un bonus exclusif de 900 FCFA offert à chaque membre qui atteint le jalon de 20 filleuls directs actifs (Niveau 1). Dès que vous atteignez 20 filleuls, le bouton « Réclamer 900 FCFA » devient actif sur votre page Récompense de Démarrage. En cliquant dessus, les 900 FCFA sont instantanément ajoutés à votre solde disponible et prêts pour le retrait.",
    icon: Gift,
  },
  {
    id: "wheel",
    category: "Tour de Bienvenue / Roue",
    question: "Comment fonctionne la Roue de Bienvenue ?",
    answer:
      "Chaque compte activé dispose d'un tour de bienvenue unique offert à vie. En tournant la roue, vous gagnez une récompense garantie de 56 FCFA créditée directement sur votre solde de retrait. Une fois le tour utilisé, la roue passe en état « Déjà utilisé ».",
    icon: Disc,
  },
  {
    id: "timetable",
    category: "Tâches Quotidiennes",
    question: "Comment sont rémunérées les tâches quotidiennes (Time Table) ?",
    answer:
      "Chaque jour ouvré de la semaine suit un planning précis :\n• Lundi : Trivia & Questions d'actualité\n• Mardi : Tâche Vidéo TikTok\n• Mercredi : Tâche YouTube\n• Jeudi : Tâche Publicités & Annonces Web\n• Vendredi : Tâche Instagram\nChaque tâche accomplie cumule des gains qui sont automatiquement versés dans votre portefeuille dès que vous atteignez le palier de retrait de 4 500 FCFA.",
    icon: CalendarCheck,
  },
  {
    id: "affiliation",
    category: "Affiliation & Équipe",
    question: "Comment fonctionne le programme d'affiliation à 3 niveaux ?",
    answer:
      "Vous touchez des commissions automatiques et immuables inscrites au grand livre sur chaque nouvel abonnement de 4 500 FCFA dans votre réseau :\n• Niveau 1 (vos filleuls directs) : 2 000 FCFA par membre\n• Niveau 2 (filleuls de 2e génération) : 1 000 FCFA par membre\n• Niveau 3 (filleuls de 3e génération) : 500 FCFA par membre\nLes commissions sont disponibles immédiatement pour vos retraits.",
    icon: Users,
  },
  {
    id: "retrait",
    category: "Retraits Mobile Money",
    question: "Quand et comment effectuer un retrait Mobile Money ?",
    answer:
      "Le seuil minimum de retrait est de 4 500 FCFA. Lorsque votre solde atteint ce montant, rendez-vous dans le Centre de Retrait, sélectionnez votre opérateur Mobile Money (T-Money Togo ou Moov Money Flooz), saisissez votre numéro de téléphone et le montant souhaité. Votre demande est traitée rapidement sous 12h à 24h ouvrées.",
    icon: Wallet,
  },
  {
    id: "marche",
    category: "Marketplace & Boutique",
    question: "Puis-je vendre mes propres produits ou services sur la Marketplace ?",
    answer:
      "Oui ! Tout membre ayant un compte activé peut publier des produits physiques ou digitaux (ebooks, logiciels, formations, services) sur la marketplace Vita Earn. Les annonces sont vérifiées pour garantir la conformité et la sécurité des transactions pour tous les acheteurs.",
    icon: ShoppingBag,
  },
  {
    id: "securite",
    category: "Sécurité & Compte",
    question: "Mes fonds et mes données sont-ils sécurisés ?",
    answer:
      "La sécurité et l'intégrité de vos fonds sont notre priorité absolue. Les soldes sont calculés dynamiquement à partir d'un grand livre comptable immuable (ledger). Aucune manipulation manuelle n'est possible, et toutes les transactions Mobile Money sont vérifiées par protocole cryptographique.",
    icon: Lock,
  },
];

export function FaqModal({ isOpen, onClose }: FaqModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("activation");

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQS_DATA;
    return FAQS_DATA.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Fond obscurci */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Boîte modale */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#131E17] rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-gray-100 dark:border-[#1E2E24] animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-vita-deep to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Foire Aux Questions (FAQ)
              </h2>
              <p className="text-xs text-emerald-100/80">
                Tout comprendre sur Vita Earn de A à Z
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fermer la FAQ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="p-3 sm:p-4 bg-gray-50/80 dark:bg-[#0E1812] border-b border-gray-100 dark:border-[#1E2E24] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une question (ex: activation, retrait, parrainage)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Liste des Questions & Réponses */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Aucune question trouvée pour « {searchQuery} ».
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              const Icon = faq.icon;
              return (
                <div
                  key={faq.id}
                  className="border border-gray-100 dark:border-[#1E2E24] rounded-2xl overflow-hidden bg-white dark:bg-[#17241C] shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-[#1C2C22] transition-colors gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {faq.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line border-t border-gray-50 dark:border-[#1E2E24] bg-gray-50/50 dark:bg-[#131E17]/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pied de modal */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-[#0E1812] border-t border-gray-100 dark:border-[#1E2E24] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {filteredFaqs.length} question(s) disponible(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer la FAQ
          </button>
        </div>
      </div>
    </div>
  );
}
