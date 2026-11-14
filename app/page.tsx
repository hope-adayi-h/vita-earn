import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatFCFA } from "@/lib/utils";
import { ReferralSection } from "@/components/ReferralSection";
import { WelcomeBonusCard } from "@/components/WelcomeBonusCard";
import { TimeTableSection } from "@/components/TimeTableSection";
import {
  Wallet,
  CreditCard,
  Building2,
  Gift,
  HelpCircle,
  Zap,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  ShoppingBag,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";

export const metadata = {
  title: "Tableau de Bord — Vita Earn",
  description: "Gérez vos revenus, votre solde et vos retraits Mobile Money en temps réel.",
};

function getBaseAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;

  try {
    const headerList = headers();
    const host = headerList.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  } catch {
    return "http://localhost:3000";
  }
}

export default async function HomePage() {
  let isActivated = false;
  let userName = "Koffi";
  let userInitial = "K";
  let balance = 0;
  let totalWithdrawn = 0;
  let totalEarned = 0;
  let totalExpenses = 0;
  let triviaEarnings = 0; // Au départ à 0 FCFA comme demandé par l'utilisateur
  let welcomeBonusClaimed = false;

  let referralCode = "VE8K2X";
  let level1Count = 0;
  let level2Count = 0;
  let level3Count = 0;
  let level1Earned = 0;
  let level2Earned = 0;
  let level3Earned = 0;
  let referralsList: Array<{
    id: string;
    name: string;
    date: string;
    level: number;
    isActivated: boolean;
  }> = [];

  let ledgerEntries: Array<{
    id: string;
    amount: number;
    entry_type: string;
    description: string;
    created_at: string;
  }> = [];

  const appUrl = getBaseAppUrl();

  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("placeholder");

    if (isConfigured) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, is_activated, referral_code, welcome_bonus_claimed")
        .eq("id", user.id)
        .maybeSingle();

      isActivated = Boolean(profile?.is_activated);
      welcomeBonusClaimed = Boolean(profile?.welcome_bonus_claimed);

      // Récupération stricte du nom d'utilisateur spécifié lors de l'inscription (ex: Koffi)
      const rawName =
        profile?.full_name ||
        (user.user_metadata?.username as string) ||
        (user.user_metadata?.full_name as string) ||
        (user.email ? user.email.split("@")[0] : "");

      if (rawName && rawName.trim().length > 0) {
        userName = rawName.trim().charAt(0).toUpperCase() + rawName.trim().slice(1);
      } else {
        userName = "Koffi";
      }
      userInitial = userName.charAt(0).toUpperCase();

      // Referral code unique
      if (profile?.referral_code) {
        referralCode = profile.referral_code;
      } else {
        const adminClient = createAdminClient();
        const newCode = "VE" + Math.random().toString(36).substring(2, 8).toUpperCase();
        await adminClient
          .from("profiles")
          .update({ referral_code: newCode })
          .eq("id", user.id);
        referralCode = newCode;
      }

      // Lecture du solde réel depuis la vue wallet_balances (Règle 1 : somme de ledger_entries)
      const { data: wb } = await supabase
        .from("wallet_balances")
        .select("balance, available_balance, pending_balance, total_earned, total_withdrawn")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wb) {
        balance = Number(wb.available_balance ?? wb.balance) || 0;
        totalEarned = Number(wb.total_earned) || 0;
        totalWithdrawn = Number(wb.total_withdrawn) || 0;
      }

      // Espèces engagées : 4 500 FCFA dès que le compte est activé
      if (isActivated) {
        totalExpenses = 4500;
      }

      // Lecture des commissions par niveau
      const { data: comms } = await supabase
        .from("commissions")
        .select("level, amount, status")
        .eq("beneficiary_id", user.id);

      if (comms) {
        comms.forEach((c) => {
          const amt = Number(c.amount) || 0;
          if (c.level === 1) level1Earned += amt;
          else if (c.level === 2) level2Earned += amt;
          else if (c.level === 3) level3Earned += amt;
        });
      }

      // Lecture des gains des tâches quotidiennes (Time Table)
      const { data: userTaskEarnings } = await supabase
        .from("user_task_earnings")
        .select("task_type, accumulated_amount")
        .eq("user_id", user.id);

      if (userTaskEarnings) {
        const triviaObj = userTaskEarnings.find((t) => t.task_type === "trivia");
        if (triviaObj) {
          triviaEarnings = Number(triviaObj.accumulated_amount) || 0;
        }
      }

      // Réseau de parrainage sur 3 générations
      // 1. Niveau 1 (Filleuls directs)
      const { data: l1Referrals } = await supabase
        .from("referrals")
        .select("referred_id, created_at")
        .eq("referrer_id", user.id);

      const l1Ids = (l1Referrals || []).map((r) => r.referred_id);
      level1Count = l1Ids.length;

      let l2Ids: string[] = [];
      let l3Ids: string[] = [];

      // 2. Niveau 2 (Filleuls du niveau 1)
      if (l1Ids.length > 0) {
        const { data: l2Referrals } = await supabase
          .from("referrals")
          .select("referred_id, created_at")
          .in("referrer_id", l1Ids);

        l2Ids = (l2Referrals || []).map((r) => r.referred_id);
        level2Count = l2Ids.length;

        // 3. Niveau 3 (Filleuls du niveau 2)
        if (l2Ids.length > 0) {
          const { data: l3Referrals } = await supabase
            .from("referrals")
            .select("referred_id, created_at")
            .in("referrer_id", l2Ids);

          l3Ids = (l3Referrals || []).map((r) => r.referred_id);
          level3Count = l3Ids.length;
        }
      }

      // Récupérer les profils des filleuls pour la liste
      const allReferredIds = [...l1Ids, ...l2Ids, ...l3Ids];
      if (allReferredIds.length > 0) {
        const { data: refProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, is_activated, created_at")
          .in("id", allReferredIds);

        const profileMap = new Map((refProfiles || []).map((p) => [p.id, p]));

        l1Referrals?.forEach((r) => {
          const p = profileMap.get(r.referred_id);
          referralsList.push({
            id: r.referred_id,
            name: p?.full_name || "Membre",
            date: new Date(r.created_at).toLocaleDateString("fr-FR"),
            level: 1,
            isActivated: Boolean(p?.is_activated),
          });
        });

        l2Ids.forEach((id) => {
          const p = profileMap.get(id);
          referralsList.push({
            id,
            name: p?.full_name || "Membre",
            date: p?.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "Récent",
            level: 2,
            isActivated: Boolean(p?.is_activated),
          });
        });

        l3Ids.forEach((id) => {
          const p = profileMap.get(id);
          referralsList.push({
            id,
            name: p?.full_name || "Membre",
            date: p?.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "Récent",
            level: 3,
            isActivated: Boolean(p?.is_activated),
          });
        });
      }

      // Dernières écritures du grand livre
      const { data: entries } = await supabase
        .from("ledger_entries")
        .select("id, amount, entry_type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (entries) {
        ledgerEntries = entries.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          entry_type: e.entry_type,
          description: e.description,
          created_at: e.created_at,
        }));
      }
    }
  }

  // Si pas connecté ou mode démo, initialiser les valeurs de démonstration demandées (ex: Koffi)
  if (!userName || userName === "Koffi") {
    userName = "Koffi";
    userInitial = "K";
    isActivated = true;
    balance = 1070;
    totalWithdrawn = 445249;
    totalEarned = 3449121;
    totalExpenses = 4500;
    level1Count = 14;
    level2Count = 8;
    level3Count = 3;
    level1Earned = 28000;
    level2Earned = 8000;
    level3Earned = 1500;
  }
} catch {
  // Mode repli sécurisé
  userName = "Koffi";
  userInitial = "K";
  isActivated = true;
  balance = 1070;
  totalWithdrawn = 445249;
  totalEarned = 3449121;
  totalExpenses = 4500;
  level1Count = 14;
  level2Count = 8;
  level3Count = 3;
  level1Earned = 28000;
  level2Earned = 8000;
  level3Earned = 1500;
}

  // Calcul du Welcome Bonus (900 FCFA débloqués après 20 invitations directes)
  const welcomeBonusTarget = 20;
  const welcomeBonusAmount = 900;
  const welcomeBonusProgress = Math.min(
    100,
    Math.round((level1Count / welcomeBonusTarget) * 100)
  );
  const isWelcomeBonusUnlocked = level1Count >= welcomeBonusTarget;

  return (
    <div className="max-w-xl mx-auto py-2 sm:py-4 space-y-4">
      {/* 1. CARTE EN-TÊTE PREMIUM - VERT VIBRANT #16A34A (Même vert que le bouton Retirer de Solde) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#16A34A] via-[#16A34A] to-[#15803D] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-white/20">
        {/* Éléments scintillants d'arrière-plan */}
        <div className="absolute top-3 right-6 text-white/50 pointer-events-none">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div className="absolute top-12 right-2 text-emerald-100/40 pointer-events-none">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-emerald-300/15 rounded-full blur-2xl pointer-events-none" />

        {/* Profil utilisateur & Salutation */}
        <div className="flex items-start gap-3.5 relative z-10 mb-4">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-2xl shadow-inner flex-shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs sm:text-sm text-emerald-100 font-medium block">
              Bienvenue,
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {userName}
              </h1>
              <span className="flex-shrink-0 text-amber-300" title="Membre Actif">
                <Award className="w-5 h-5" />
              </span>
              {isActivated && (
                <ShieldCheck className="w-4 h-4 text-emerald-200 flex-shrink-0" />
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-50 mt-1 leading-snug">
              Chez <strong className="text-white font-bold">VitaEarn</strong>, accédez à un ensemble diversifié de 10+ produits digitaux et formations adaptés à vos BESOINS.
            </p>
          </div>
        </div>

        {/* BLOCS MÉTRIQUES : ESPÈCES (4 500 FCFA) & PROFITS */}
        <div className="grid grid-cols-2 gap-3 pt-2 relative z-10">
          {/* Bloc Espèces (Dépenses d'activation du compte) */}
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 p-3.5 sm:p-4 relative overflow-hidden flex flex-col justify-between transition-all hover:bg-black/30 shadow-inner">
            {/* Liseré indicateur latéral rose/corail */}
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r bg-rose-400" />
            <div className="flex items-center gap-2 mb-2 pl-1.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/30 text-rose-200 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-wider text-rose-200 uppercase">
                ESPÈCES
              </span>
            </div>
            <div className="pl-1.5">
              <span className="text-[10px] font-bold text-white/80 block uppercase tracking-wide">
                XOF
              </span>
              <span className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {totalExpenses.toLocaleString("fr-FR")}
              </span>
            </div>
          </div>

          {/* Bloc Profits (Total des gains) */}
          <div className="rounded-2xl bg-black/20 backdrop-blur-md border border-white/25 p-3.5 sm:p-4 relative overflow-hidden flex flex-col justify-between transition-all hover:bg-black/30 shadow-inner">
            {/* Liseré indicateur latéral Blanc / Émeraude lumineux */}
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r bg-emerald-200" />
            <div className="flex items-center gap-2 mb-2 pl-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 text-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-100" />
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-wider text-emerald-100 uppercase">
                PROFIT
              </span>
            </div>
            <div className="pl-1.5">
              <span className="text-[10px] font-bold text-white/80 block uppercase tracking-wide">
                XOF
              </span>
              <span className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {totalEarned.toLocaleString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARTE SOLDE DU COMPTE (Account Balance) - Vert Pastel #DDF3E4 */}
      <div className="rounded-2xl bg-[#DDF3E4] p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#16A34A] flex items-center justify-center shadow-xs">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1F2937] tracking-wide">Solde du Compte</h2>
              <p className="text-[10px] text-[#4B5563]">Votre solde disponible en direct</p>
            </div>
          </div>
          <Link
            href="/portefeuille"
            className="px-3 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803d] text-[11px] font-bold text-white transition-colors inline-flex items-center gap-1 shadow-xs"
          >
            <span>Retirer</span>
            <ArrowRight className="w-3 h-3 text-white" />
          </Link>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
            XOF
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight">
            {balance.toLocaleString("fr-FR")}
          </span>
        </div>
      </div>

      {/* 3. CARTE TOTAL DES RETRAITS (Total Withdrawals) - Orange Pastel #FDE5DA */}
      <div className="rounded-2xl bg-[#FDE5DA] p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center shadow-xs">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1F2937] tracking-wide">Total des Retraits</h2>
              <p className="text-[10px] text-[#4B5563]">Montant total retiré par Mobile Money</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-[9px] font-bold text-white shadow-xs">
            T-Money / Flooz
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
            XOF
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight">
            {totalWithdrawn.toLocaleString("fr-FR")}
          </span>
        </div>
      </div>

      {/* 4. CARTE BONUS DE BIENVENUE (Welcome Bonus 900 FCFA) AVEC DÉBLOCAGE MANUEL */}
      <WelcomeBonusCard
        level1Count={level1Count}
        welcomeBonusAmount={900}
        initialClaimed={welcomeBonusClaimed}
      />

      {/* 5. CARTE GAINS TRIVIA (Trivia Earnings) - Bleu Pastel #DCEBFB */}
      <div className="rounded-2xl bg-[#DCEBFB] p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-xs">
              <HelpCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1F2937] tracking-wide">Trivia Earnings</h2>
              <p className="text-[10px] text-[#4B5563]">
                Répondez aux questions et gagnez des récompenses
              </p>
            </div>
          </div>
          <Link
            href="/taches"
            className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-[10px] font-bold text-white transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>Voir Time Table</span>
            <ArrowRight className="w-3 h-3 text-white" />
          </Link>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
            XOF
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight">
            {triviaEarnings.toLocaleString("fr-FR")}
          </span>
        </div>
      </div>

      {/* 6. CARTE OUTILS & FORMATIONS DÉBLOQUÉS */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-900 p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">Outils & Formations</h2>
              <p className="text-[10px] text-purple-100">Modules et applications de vente</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold text-white">
            10+ Modules
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-black text-white">Accès Immédiat</span>
          <Link
            href="/marche"
            className="px-3 py-1 rounded-lg bg-white text-indigo-900 font-bold text-[11px] shadow-sm hover:bg-opacity-95 transition-all inline-flex items-center gap-1"
          >
            <span>Accéder aux ressources</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 7. TIME TABLE - PLANNING DES 5 TÂCHES RÉMUNÉRÉES (TRIVIA, TIKTOK, YOUTUBE, ADS, INSTAGRAM) */}
      <TimeTableSection />

      {/* 7. SECTION RÉSEAU & PARRAINAGE 3 NIVEAUX */}
      <ReferralSection
        referralCode={referralCode}
        appUrl={appUrl}
        level1Count={level1Count}
        level2Count={level2Count}
        level3Count={level3Count}
        level1Earned={level1Earned}
        level2Earned={level2Earned}
        level3Earned={level3Earned}
        referrals={referralsList}
      />

      {/* 8. RACCOURCIS D'ACTION RAPIDE */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/vendre"
          className="p-4 rounded-2xl bg-white border border-vita-border hover:border-vita-medium shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-vita-text group-hover:text-vita-deep">
              Publier un article
            </span>
            <span className="block text-[11px] text-vita-muted">Vendre sur le marché</span>
          </div>
        </Link>

        <Link
          href="/marche"
          className="p-4 rounded-2xl bg-white border border-vita-border hover:border-emerald-500 shadow-sm transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-vita-text group-hover:text-blue-700">
              Place de Marché
            </span>
            <span className="block text-[11px] text-vita-muted">Explorer & Acheter</span>
          </div>
        </Link>
      </div>

      {/* 9. HISTORIQUE DES OPÉRATIONS RÉCENTES */}
      <div className="bg-white rounded-3xl border border-vita-border p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-vita-border/60 pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-vita-text uppercase tracking-wider">
            Activité récente du compte
          </h3>
          <Link
            href="/portefeuille"
            className="text-[11px] font-bold text-vita-deep hover:underline inline-flex items-center gap-1"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-vita-muted">
            <Clock className="w-6 h-6 mx-auto mb-1.5 text-vita-muted/60" />
            <span>Aucune transaction enregistrée pour l'instant.</span>
          </div>
        ) : (
          <div className="divide-y divide-vita-border/50">
            {ledgerEntries.map((entry) => (
              <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-vita-text block">{entry.description}</span>
                  <span className="text-[10px] text-vita-muted">
                    {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <span
                  className={`font-black ${
                    entry.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {formatFCFA(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
