import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseAppUrl } from "@/lib/utils";
import { ReferralSection } from "@/components/ReferralSection";
import {
  Wallet,
  Users,
  ShieldCheck,
  Calendar,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

export const metadata = {
  title: "Paramètres du compte — Vita Earn",
  description: "Gère ton profil, ta sécurité et tes préférences.",
};

export default async function ProfilPage() {
  const supabase = createClient();
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {}

  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }
  const testUser = cookieStore.get("vita_test_user")?.value || sessionUser?.username;
  const testEmail = cookieStore.get("vita_test_email")?.value || sessionUser?.email;
  const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

  const userEmail = user?.email || testEmail || sessionUser?.email || "adandohoinc@gmail.com";
  const adminClient = createAdminClient();

  // 1. Récupération du profil
  let profile: any = null;
  if (user?.id) {
    try {
      const { data: p } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = p;
    } catch {}
  }

  const isActivated = user
    ? Boolean(profile?.is_activated)
    : Boolean(isActivatedCookie || (sessionUser?.isActivated ?? true));

  const username =
    profile?.full_name ||
    testUser ||
    sessionUser?.name ||
    (user?.email ? user.email.split("@")[0] : "camsho");

  // Initiales (2 lettres pour l'avatar rond)
  const initials = username
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CA";

  const country = profile?.country || "TOGO";

  // 2. Récupération du solde réel dans le grand livre
  let balance = 25676;
  if (user?.id) {
    try {
      const { data: wallet } = await adminClient
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        const { data: entries } = await adminClient
          .from("ledger_entries")
          .select("amount")
          .eq("wallet_id", wallet.id);

        if (entries && entries.length > 0) {
          balance = entries.reduce(
            (sum, e) => sum + (Number(e.amount) || 0),
            0
          );
        } else {
          balance = 0;
        }
      }
    } catch {}
  } else if (sessionUser?.balance !== undefined) {
    balance = Number(sessionUser.balance) || 0;
  }

  // 3. Nombre d'invités directs (Niveau 1)
  let inviteCount = 2654;
  if (user?.id) {
    try {
      const { count: directCount } = await adminClient
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", user.id);
      inviteCount = directCount || 0;
    } catch {}
  }

  // 4. Parrain direct (upline)
  let uplineUsername = "greatness";
  if (user?.id) {
    try {
      const { data: refRecord } = await adminClient
        .from("referrals")
        .select("referrer_id")
        .eq("referred_id", user.id)
        .maybeSingle();

      if (refRecord?.referrer_id) {
        const { data: uplineProfile } = await adminClient
          .from("profiles")
          .select("full_name")
          .eq("id", refRecord.referrer_id)
          .maybeSingle();

        if (uplineProfile?.full_name) {
          uplineUsername = uplineProfile.full_name;
        }
      } else {
        uplineUsername = "—";
      }
    } catch {
      uplineUsername = "—";
    }
  }

  // 5. Dates d'inscription
  const dateObj = new Date(profile?.created_at || user?.created_at || "2026-06-13T10:00:00Z");
  const monthNamesShort = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
  ];
  const joinedMonthYear = `${monthNamesShort[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  const monthNamesFull = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const joinedFullDate = `${dateObj.getDate()} ${monthNamesFull[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  const phone = profile?.phone || "22892529768";
  const referralCode = profile?.referral_code || "VEKOFFI";
  const appUrl = getBaseAppUrl();

  return (
    <div className="min-h-screen bg-[#F4F7F0] dark:bg-[#0A120E] py-6 sm:py-10 px-3 sm:px-4 transition-colors">
      <div className="max-w-xl mx-auto space-y-6">
        {/* En-tête Titre & Sous-titre */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#14201A] dark:text-white tracking-tight">
            Paramètres du compte
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6B60] dark:text-gray-300">
            Gère ton profil, ta sécurité et tes préférences.
          </p>
        </div>

        {/* 1. Carte de profil avec bannière et avatar */}
        <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] shadow-xs overflow-hidden">
          {/* Bannière en dégradé vert avec halo violet discret */}
          <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-[#14500C] via-[#2F7A1A] to-[#7ED321] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#7C3AED]/25 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Informations utilisateur sous la bannière */}
          <div className="px-5 sm:px-7 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
              {/* Avatar rond avec initiales (fond #D9F99D, texte #14500C) */}
              <div className="flex items-end gap-3.5 -mt-10 sm:-mt-12">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D9F99D] text-[#14500C] font-black text-2xl sm:text-3xl flex items-center justify-center border-4 border-white dark:border-[#131E17] shadow-md shrink-0 select-none">
                  {initials}
                </div>
                <div className="mb-1">
                  <h2 className="text-lg sm:text-xl font-black text-[#14201A] dark:text-white truncate">
                    {username}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {/* Badge statut */}
                    {isActivated ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14500C] dark:text-[#86EFAC] bg-[#DCFCE7] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                        Compte activé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 rounded-full">
                        Non activé
                      </span>
                    )}

                    {/* Badge pays */}
                    <span className="inline-flex items-center text-[11px] font-bold text-[#14500C] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                      {country}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Quatre cartes en grille 2×2 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* CARTE 1 : SOLDE (#D9F99D vers #86EFAC) */}
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#D9F99D] to-[#86EFAC] shadow-xs space-y-2 border border-emerald-300/40">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 shadow-2xs flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#14500C]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-[#14500C]/75">
                SOLDE
              </p>
              <p className="text-base sm:text-xl font-black text-[#14500C] truncate mt-0.5">
                XOF {balance.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>

          {/* CARTE 2 : INVITÉS (#DCFCE7 vers #A7F3D0) */}
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#DCFCE7] to-[#A7F3D0] shadow-xs space-y-2 border border-emerald-300/40">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 shadow-2xs flex items-center justify-center">
              <Users className="w-4 h-4 text-[#14500C]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-[#14500C]/75">
                INVITÉS
              </p>
              <p className="text-base sm:text-2xl font-black text-[#14500C] truncate mt-0.5">
                {inviteCount}
              </p>
            </div>
          </div>

          {/* CARTE 3 : STATUT (#166534 vers #65A30D, texte blanc) */}
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#166534] to-[#65A30D] shadow-xs space-y-2 text-white">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 shadow-2xs flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-white/80">
                STATUT
              </p>
              <p className="text-base sm:text-xl font-black text-white truncate mt-0.5">
                {isActivated ? "Activé" : "Non activé"}
              </p>
            </div>
          </div>

          {/* CARTE 4 : INSCRIT (#EDE9FE vers #BBF7D0) */}
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#EDE9FE] to-[#BBF7D0] shadow-xs space-y-2 border border-emerald-200/50">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/95 shadow-2xs flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-purple-900/75">
                INSCRIT
              </p>
              <p className="text-base sm:text-xl font-black text-[#14201A] truncate mt-0.5">
                {joinedMonthYear}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Onglet "Aperçu du profil" souligné en vert */}
        <div className="border-b border-gray-200 dark:border-gray-800 pt-2">
          <span className="pb-2 text-sm font-black text-[#14500C] dark:text-[#A3E635] border-b-2 border-[#2F7A1A] inline-block">
            Aperçu du profil
          </span>
        </div>

        {/* 4. Cartes blanches arrondies avec les informations utilisateur */}
        <div className="space-y-2.5">
          {/* NOM D'UTILISATEUR */}
          <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              NOM D'UTILISATEUR
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate">
              {username}
            </p>
          </div>

          {/* E-MAIL */}
          <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              E-MAIL
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate">
              {userEmail || "Non renseigné"}
            </p>
          </div>

          {/* TÉLÉPHONE */}
          <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              TÉLÉPHONE
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate">
              {phone}
            </p>
          </div>

          {/* PARRAIN */}
          <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xl">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              PARRAIN
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate">
              {uplineUsername}
            </p>
          </div>

          {/* INSCRIT LE */}
          <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              INSCRIT LE
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate">
              {joinedFullDate}
            </p>
          </div>

          {/* PAYS */}
          <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              PAYS
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate uppercase">
              {country}
            </p>
          </div>
        </div>

        {/* 5. Bloc "Inviter des amis" réutilisé en bas de la page */}
        <div className="pt-2">
          <ReferralSection referralCode={referralCode} appUrl={appUrl} />
        </div>

        {/* 6. Bouton Se Déconnecter */}
        <div className="pt-2 pb-6 text-center">
          <form action={signOutAction}>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter de Vita Earn</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
