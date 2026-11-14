"use client";

import Link from "next/link";
import type { ActivationData } from "./types";
import { formatFCFA } from "@/lib/utils";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Lock,
} from "lucide-react";

interface ActivationClientProps {
  initialData: ActivationData;
}

export function ActivationClient({ initialData }: ActivationClientProps) {
  // Écran compte déjà pleinement activé
  if (initialData.isActivated) {
    return (
      <div className="max-w-xl mx-auto pt-4 sm:pt-10">
        <div className="bg-white rounded-3xl border border-vita-border p-6 sm:p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-vita-deep flex items-center justify-center mx-auto mb-4 border-2 border-vita-bright">
            <CheckCircle2 className="w-10 h-10 text-vita-deep" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-vita-deep mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Statut : Compte Actif
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-vita-deep mb-2">
            Votre compte est pleinement activé !
          </h1>
          <p className="text-sm text-vita-muted max-w-md mx-auto mb-8">
            Vous avez un accès complet à la vente, à la création de votre boutique et aux retraits
            de vos gains par Mobile Money.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            <div className="p-4 rounded-xl bg-vita-surface border border-vita-border">
              <ShoppingBag className="w-5 h-5 text-vita-deep mb-1.5" />
              <h3 className="text-sm font-semibold text-vita-text">Vendre des articles</h3>
              <p className="text-xs text-vita-muted mt-0.5">
                Publiez des produits physiques ou digitaux et encaissez vos ventes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-vita-surface border border-vita-border">
              <CreditCard className="w-5 h-5 text-vita-medium mb-1.5" />
              <h3 className="text-sm font-semibold text-vita-text">Retraits Mobile Money</h3>
              <p className="text-xs text-vita-muted mt-0.5">
                Retirez directement vos gains sur votre numéro T-Money, Flooz ou Wave.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/vendre"
              className="touch-target px-5 py-2.5 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-vita-bright" />
              <span>Publier un article</span>
            </Link>
            <Link
              href="/marche"
              className="touch-target px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-100" />
              <span>Explorer le Marché</span>
            </Link>
            <Link
              href="/portefeuille"
              className="touch-target px-5 py-2.5 rounded-xl bg-white hover:bg-vita-surface border border-vita-border text-vita-deep font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Mon portefeuille</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-2 sm:pt-6 space-y-6">
      {/* Carte principale d'adhésion */}
      <div className="bg-white rounded-3xl border border-vita-border overflow-hidden shadow-sm">
        {/* En-tête de l'adhésion */}
        <div className="bg-gradient-to-br from-vita-deep to-vita-medium p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Accès Vendeur & Membre Pro</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Frais d'Adhésion Vita Earn
          </h1>
          <p className="text-xs sm:text-sm text-white/85 max-w-md mx-auto leading-relaxed">
            Frais d'adhésion pour commencer votre travail et gagner de l'argent sur cette plateforme
            Vita Earn.
          </p>

          <div className="mt-6 inline-flex flex-col items-center bg-white/10 backdrop-blur px-6 py-3 rounded-2xl border border-white/20">
            <span className="text-xs uppercase tracking-wider text-white/70 font-medium">
              Tarif unique à vie
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-vita-bright mt-0.5">
              {formatFCFA(initialData.feeAmount)}
            </span>
            <span className="text-[11px] text-white/75 mt-0.5">Aucun abonnement récurrent</span>
          </div>
        </div>

        {/* Détails et Avantages inclus */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-vita-text mb-3">
              Ce qui est inclus avec votre adhésion :
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-vita-muted">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                <span>
                  Formations exclusives : Vente WhatsApp, marketing digital et développement commercial
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                <span>Outils premium & applications dédiées pour développer vos activités</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                <span>Retraits multiples et directs par Mobile Money (T-Money & Moov Flooz)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                <span>Canaux de communication & accompagnement prioritaire</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                <span>
                  Boutique en ligne certifiée & publication illimitée de produits (physiques et digitaux)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                <span>Grand livre financier sécurisé, traçabilité absolue et protection anti-fraude</span>
              </li>
            </ul>
          </div>

          {/* Bouton d'action principal vers la page de paiement complète */}
          <div className="pt-2">
            <Link
              href="/activation/paiement"
              className="w-full touch-target rounded-2xl bg-gradient-to-r from-vita-deep via-vita-medium to-[#236014] hover:from-vita-medium hover:to-vita-deep text-white font-extrabold text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 py-4 group"
            >
              <ShieldCheck className="w-5 h-5 text-vita-bright" />
              <span>Activer mon compte pour commencer à travailler</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Option Acheteur : Accès 100% Libre et Gratuit au Marché */}
      <div className="bg-white rounded-3xl border border-vita-border p-6 sm:p-7 shadow-sm relative overflow-hidden transition-all hover:border-emerald-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 mb-1.5">
                <ShoppingBag className="w-3 h-3 text-emerald-700" />
                <span>Espace Acheteur Gratuit</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-vita-text">
                Vous souhaitez uniquement acheter des articles ?
              </h2>
              <p className="text-xs sm:text-sm text-vita-muted mt-1 max-w-md leading-relaxed">
                L'adhésion de 4 500 FCFA est réservée aux vendeurs souhaitant publier et retirer des
                gains. En tant qu'acheteur, parcourez gratuitement la marketplace et commandez vos
                produits dès maintenant.
              </p>
            </div>
          </div>

          <Link
            href="/marche"
            className="w-full sm:w-auto touch-target px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 flex-shrink-0 group"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Je suis acheteur — Accéder au Marché</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
