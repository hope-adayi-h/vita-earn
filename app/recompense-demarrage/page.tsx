import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecompenseDemarrageClient, Level1Member } from "@/components/RecompenseDemarrageClient";

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
  let level1Count = testL1CountCookie ? Number(testL1CountCookie) : 20;

  // Liste de 20 filleuls de niveau 1 ultra réalistes (correspondant à la capture d'écran de l'utilisateur)
  const defaultMembers: Level1Member[] = [
    {
      id: "l1-1",
      username: "smreatio",
      fullName: "Smreatio Mensah",
      phone: "+22890265412",
      country: "TOGO",
      date: "14 Nov, 2026 14:20",
      timeAgo: "Il y a 3 jours",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-2",
      username: "amegnranantoinekokou",
      fullName: "Antoine Kokou",
      phone: "+22891340388",
      country: "TOGO",
      date: "12 Nov, 2026 11:15",
      timeAgo: "Il y a 5 jours",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-3",
      username: "amaglokoffi",
      fullName: "Koffi Amaglo",
      phone: "+22890982344",
      country: "TOGO",
      date: "10 Nov, 2026 09:40",
      timeAgo: "Il y a 1 semaine",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-4",
      username: "Baso",
      fullName: "Baso Alassani",
      phone: "+22892398200",
      country: "TOGO",
      date: "09 Nov, 2026 16:30",
      timeAgo: "Il y a 1 semaine",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-5",
      username: "bertinoaklassouronal",
      fullName: "Bertin Ronald",
      phone: "+22893674123",
      country: "TOGO",
      date: "08 Nov, 2026 18:22",
      timeAgo: "Il y a 1 semaine",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-6",
      username: "fayad27",
      fullName: "Fayad Diallo",
      phone: "+22670725890",
      country: "BURKINA FASO",
      date: "07 Nov, 2026 10:05",
      timeAgo: "Il y a 1 semaine",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-7",
      username: "viwave",
      fullName: "Viwave Mensah",
      phone: "+22890234512",
      country: "TOGO",
      date: "05 Nov, 2026 01:17",
      timeAgo: "Il y a 1 semaine",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-8",
      username: "abdulaye005",
      fullName: "Abdoulaye Sanogo",
      phone: "+22670128844",
      country: "BURKINA FASO",
      date: "04 Nov, 2026 03:15",
      timeAgo: "Il y a 2 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-9",
      username: "andres26",
      fullName: "Andrès Kouamé",
      phone: "+22507456789",
      country: "IVORY COAST",
      date: "03 Nov, 2026 02:10",
      timeAgo: "Il y a 2 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-10",
      username: "ayram7326",
      fullName: "Ayram Dosseh",
      phone: "+22891567890",
      country: "TOGO",
      date: "01 Nov, 2026 01:39",
      timeAgo: "Il y a 2 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-11",
      username: "herman002",
      fullName: "Herman Agbessi",
      phone: "+22997443322",
      country: "BENIN",
      date: "28 Oct, 2026 10:54",
      timeAgo: "Il y a 3 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-12",
      username: "koffi28",
      fullName: "Koffi Amouzou",
      phone: "+22892112233",
      country: "TOGO",
      date: "25 Oct, 2026 08:30",
      timeAgo: "Il y a 3 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-13",
      username: "samirabk",
      fullName: "Samira Bakayoko",
      phone: "+22505332211",
      country: "IVORY COAST",
      date: "22 Oct, 2026 06:15",
      timeAgo: "Il y a 3 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-14",
      username: "moussa_bf",
      fullName: "Moussa Ouedraogo",
      phone: "+22676998877",
      country: "BURKINA FASO",
      date: "20 Oct, 2026 09:20",
      timeAgo: "Il y a 4 semaines",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-15",
      username: "fabrice_cm",
      fullName: "Fabrice Kamga",
      phone: "+23767554433",
      country: "CAMEROON",
      date: "18 Oct, 2026 09:54",
      timeAgo: "Il y a 1 mois",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-16",
      username: "aicha_tg",
      fullName: "Aïcha Lawson",
      phone: "+22893445566",
      country: "TOGO",
      date: "15 Oct, 2026 04:40",
      timeAgo: "Il y a 1 mois",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-17",
      username: "ibrahim_sn",
      fullName: "Ibrahim Diop",
      phone: "+22177123456",
      country: "SENEGAL",
      date: "12 Oct, 2026 10:53",
      timeAgo: "Il y a 1 mois",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-18",
      username: "adjovi_bj",
      fullName: "Adjovi Hounkpati",
      phone: "+22995667788",
      country: "BENIN",
      date: "10 Oct, 2026 12:47",
      timeAgo: "Il y a 1 mois",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-19",
      username: "paul_tg",
      fullName: "Paul Agbodjan",
      phone: "+22890778899",
      country: "TOGO",
      date: "08 Oct, 2026 07:18",
      timeAgo: "Il y a 1 mois",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
    {
      id: "l1-20",
      username: "daniella_ci",
      fullName: "Daniella Yao",
      phone: "+22507889900",
      country: "IVORY COAST",
      date: "05 Oct, 2026 15:02",
      timeAgo: "Il y a 1 mois",
      amountPaid: 4500,
      commissionEarned: 2200,
      isActivated: true,
    },
  ];

  let displayMembers = defaultMembers;

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
        .select("id, referee_id, created_at", { count: "exact" })
        .eq("referrer_id", user.id);

      if (count !== null && count > 0) {
        level1Count = count;
        // On récupère les profils
        const refereeIds = (realL1 || []).map((r) => r.referee_id);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, username, full_name, phone, country, is_activated, created_at")
          .in("id", refereeIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        const formattedReal: Level1Member[] = (realL1 || []).map((r, i) => {
          const prof = profileMap.get(r.referee_id);
          return {
            id: r.id,
            username: prof?.username || `filleul_${i + 1}`,
            fullName: prof?.full_name || "Membre",
            phone: prof?.phone || "Non renseigné",
            country: prof?.country || "TOGO",
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
