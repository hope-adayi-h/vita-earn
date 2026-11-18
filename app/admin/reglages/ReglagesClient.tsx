"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Settings,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  DollarSign,
  Share2,
  Headphones,
  Shield,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { updatePlatformSettingsAction } from "@/app/admin/actions";

interface ReglagesClientProps {
  initialSettings: {
    activationFee: number;
    l1: number;
    l2: number;
    l3: number;
    platformMargin: number;
    minWithdrawal: number;
    whatsapp: string;
    telegram: string;
    email: string;
  };
}

export function ReglagesClient({ initialSettings }: ReglagesClientProps) {
  const [activationFee, setActivationFee] = useState(initialSettings.activationFee);
  const [l1, setL1] = useState(initialSettings.l1);
  const [l2, setL2] = useState(initialSettings.l2);
  const [l3, setL3] = useState(initialSettings.l3);
  const [minWithdrawal, setMinWithdrawal] = useState(initialSettings.minWithdrawal);
  const [whatsapp, setWhatsapp] = useState(initialSettings.whatsapp);
  const [telegram, setTelegram] = useState(initialSettings.telegram);
  const [email, setEmail] = useState(initialSettings.email);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCommissions = Number(l1) + Number(l2) + Number(l3);
  const platformMargin = Math.max(0, Number(activationFee) - totalCommissions);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        await updatePlatformSettingsAction({
          key: "activation_fee",
          value: { amount: Number(activationFee), currency: "XOF" },
          description: "Frais unique d'activation du compte Vita Earn",
        });

        await updatePlatformSettingsAction({
          key: "subscription_commissions",
          value: {
            l1: Number(l1),
            l2: Number(l2),
            l3: Number(l3),
            platform_margin: platformMargin,
          },
          description: "Répartition des commissions d'affiliation sur abonnement",
        });

        await updatePlatformSettingsAction({
          key: "withdrawal_settings",
          value: { min_amount: Number(minWithdrawal), fee_percent: 0 },
          description: "Paramètres des retraits Mobile Money",
        });

        await updatePlatformSettingsAction({
          key: "support_contacts",
          value: { whatsapp, telegram, email },
          description: "Coordonnées officielles de support",
        });

        setMessage({
          type: "success",
          text: "Tous les réglages de la plateforme ont été mis à jour avec succès.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur d'enregistrement.";
        setMessage({ type: "error", text: msg });
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au tableau de bord</span>
        </Link>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Réglages de la Plateforme (Platform Settings)
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Modifiez dynamiquement les tarifs, la répartition des commissions et les coordonnées sans changer le code
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Tarifs & Abonnement d'Activation */}
      <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Abonnement & Frais d&apos;Activation
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Paiement unique ouvrant l&apos;accès à la plateforme et à l&apos;affiliation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Prix de l&apos;Abonnement (FCFA)
            </label>
            <input
              type="number"
              value={activationFee}
              onChange={(e) => setActivationFee(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Seuil Minimum de Retrait Mobile Money (FCFA)
            </label>
            <input
              type="number"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Répartition des Commissions (Affiliation 3 Niveaux Légaux) */}
      <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Programme d&apos;Affiliation (3 Niveaux)
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Rémunération par abonnement payé et vérifié
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Niveau 1 — Parrain Direct (FCFA)
            </label>
            <input
              type="number"
              value={l1}
              onChange={(e) => setL1(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Niveau 2 — Second Degré (FCFA)
            </label>
            <input
              type="number"
              value={l2}
              onChange={(e) => setL2(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Niveau 3 — Troisième Degré (FCFA)
            </label>
            <input
              type="number"
              value={l3}
              onChange={(e) => setL3(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-gray-600 dark:text-gray-300">
            Total distribué : <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatFCFA(totalCommissions)}</span>
          </span>
          <span className="font-bold text-emerald-800 dark:text-emerald-300">
            Marge brute restante pour Vita Earn : {formatFCFA(platformMargin)} par activation
          </span>
        </div>
      </div>

      {/* 3. Support & Coordonnées Officielles */}
      <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Coordonnées Officielles du Support
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Affichées aux utilisateurs sur les pages d&apos;assistance et de contact
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              WhatsApp Officiel
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Canal Telegram
            </label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Email Support
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? "Enregistrement..." : "Enregistrer les Réglages"}</span>
        </button>
      </div>
    </form>
  );
}
