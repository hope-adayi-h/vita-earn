import { createClient } from "@/lib/supabase/server";
import { getBaseAppUrl } from "@/lib/utils";
import { cookies } from "next/headers";
import { EquipeView, ReferralMember } from "@/components/EquipeView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mon Équipe & Réseau — Vita Earn",
  description: "Consultez vos filleuls de Niveau 1, Niveau 2, Niveau 3 et membres inactifs.",
};

export default async function EquipePage({
  searchParams,
}: {
  searchParams: { level?: string };
}) {
  const supabase = createClient();
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      try {
        sessionUser = JSON.parse(decodeURIComponent(sessionUserCookie));
      } catch {}
    }
  }

  const initialTab = searchParams.level || "1";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let referralCode = sessionUser?.referralCode || "VE-ESPOIR";
  let level1Earned = 0;
  let level2Earned = 0;
  let level3Earned = 0;

  let realMembers: ReferralMember[] = [];

  const appUrl = getBaseAppUrl();

  try {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.referral_code) {
        referralCode = profile.referral_code;
      }

      // Lecture des commissions
      const { data: comms } = await supabase
        .from("commissions")
        .select("level, amount, status")
        .eq("beneficiary_id", user.id);

      if (comms && comms.length > 0) {
        comms.forEach((c) => {
          const amt = Number(c.amount) || 0;
          if (c.level === 1) level1Earned += amt;
          else if (c.level === 2) level2Earned += amt;
          else if (c.level === 3) level3Earned += amt;
        });
      }

      // Récupération des vrais parrainages dans Supabase
      const { data: l1Referrals } = await supabase
        .from("referrals")
        .select("referred_id, created_at")
        .eq("referrer_id", user.id);

      if (l1Referrals && l1Referrals.length > 0) {
        const l1Ids = l1Referrals.map((r) => r.referred_id);
        const { data: refProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone, is_activated, created_at")
          .in("id", l1Ids);

        const profMap = new Map((refProfiles || []).map((p) => [p.id, p]));

        l1Referrals.forEach((r) => {
          const p = profMap.get(r.referred_id);
          const isAct = Boolean(p?.is_activated);
          realMembers.push({
            id: r.referred_id,
            username: (p?.full_name || "Membre").toLowerCase().replace(/\s+/g, "_"),
            fullName: p?.full_name || "Membre",
            phone: p?.phone ? p.phone.replace(/\s+/g, "") : "+22890000000",
            country: "TOGO",
            date: new Date(r.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            timeAgo: "Récent",
            level: 1,
            amountPaid: isAct ? 4500 : 0,
            commissionEarned: isAct ? 2000 : 0,
            isActivated: isAct,
          });
        });
      }
    }
  } catch {}

  const allMembers = realMembers;

  // Calculer les compteurs précis (100% réels)
  const l1Count = allMembers.filter((m) => m.level === 1 && m.isActivated).length;
  const l2Count = allMembers.filter((m) => m.level === 2 && m.isActivated).length;
  const l3Count = allMembers.filter((m) => m.level === 3 && m.isActivated).length;
  const inactCount = allMembers.filter((m) => !m.isActivated).length;

  return (
    <main className="min-h-screen bg-[#F4F7F0] dark:bg-[#0A120E] pb-24 md:pb-12 transition-colors">
      <EquipeView
        referralCode={referralCode}
        appUrl={appUrl}
        level1Count={l1Count}
        level2Count={l2Count}
        level3Count={l3Count}
        inactifsCount={inactCount}
        level1Earned={level1Earned}
        level2Earned={level2Earned}
        level3Earned={level3Earned}
        initialTab={initialTab}
        referrals={allMembers}
      />
    </main>
  );
}
