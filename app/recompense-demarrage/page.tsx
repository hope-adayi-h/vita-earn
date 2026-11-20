import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecompenseDemarrageClient, Level1Member } from "@/components/RecompenseDemarrageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Récompense de Démarrage — Vita Earn",
  description: "Débloquez et réclamez votre bonus de jalon de 900 FCFA après 20 parrainages de niveau 1.",
};

export default async function RecompenseDemarragePage() {
  const supabase = createClient();
  const cookieStore = cookies();

  const isClaimedCookie = cookieStore.get("vita_welcome_bonus_claimed")?.value === "true";
  const testL1CountCookie = cookieStore.get("vita_test_l1_count")?.value;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isClaimed = isClaimedCookie;
  let level1Count = testL1CountCookie ? Number(testL1CountCookie) : 0;

  let displayMembers: Level1Member[] = [];

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  if (isConfigured && user) {
    try {
      const adminClient = createAdminClient();

      // Vérifier si le bonus est réclamé sur le profil
      const { data: profile } = await adminClient
        .from("profiles")
        .select("welcome_bonus_claimed")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.welcome_bonus_claimed) {
        isClaimed = true;
      }

      // Compter les vrais filleuls de niveau 1
      const { data: realL1, count } = await adminClient
        .from("referrals")
        .select("id, referred_id, created_at", { count: "exact" })
        .eq("referrer_id", user.id);

      if (count !== null && count > 0) {
        level1Count = count;
        // On récupère les profils
        const refereeIds = (realL1 || []).map((r) => r.referred_id);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, phone, is_activated, created_at")
          .in("id", refereeIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        const formattedReal: Level1Member[] = (realL1 || []).map((r, i) => {
          const prof = profileMap.get(r.referred_id);
          return {
            id: r.id,
            username: (prof?.full_name || `filleul_${i + 1}`).toLowerCase().replace(/\s+/g, "_"),
            fullName: prof?.full_name || "Membre",
            phone: prof?.phone || "Non renseigné",
            country: "TOGO",
            date: new Date(r.created_at).toLocaleDateString("fr-FR"),
            timeAgo: "Récemment",
            amountPaid: 4500,
            commissionEarned: 2200,
            isActivated: prof?.is_activated ?? true,
          };
        });

        if (formattedReal.length > 0) {
          displayMembers = formattedReal;
        }
      }
    } catch (e) {
      console.error("Erreur chargement recompense demarrage:", e);
    }
  }

  return (
    <RecompenseDemarrageClient
      level1Count={level1Count}
      bonusAmount={900}
      initialClaimed={isClaimed}
      members={displayMembers}
    />
  );
}
