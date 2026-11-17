import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseAppUrl } from "@/lib/utils";
import { cookies } from "next/headers";
import { EquipeView, ReferralMember } from "@/components/EquipeView";

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
  const testUser = cookieStore.get("test_user")?.value;
  const initialTab = searchParams.level || "1";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let referralCode = "VEKOFFI";
  let level1Earned = 28000;
  let level2Earned = 8000;
  let level3Earned = 1500;

  let realMembers: ReferralMember[] = [];

  const appUrl = getBaseAppUrl();

  // Membres de démonstration / référence ultra réalistes d'après les captures d'écran de l'utilisateur
  const sampleMembers: ReferralMember[] = [
    // --- NIVEAU 1 (14 membres, 2 000 FCFA chacun, Inscription 4 500 FCFA) ---
    {
      id: "ref-l1-1",
      username: "viwave",
      fullName: "Viwave Mensah",
      phone: "+22890234512",
      country: "TOGO",
      date: "08 Nov, 2026 01:17",
      timeAgo: "Il y a 6 jours",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-2",
      username: "abdulaye005",
      fullName: "Abdoulaye Sanogo",
      phone: "+22670128844",
      country: "BURKINA FASO",
      date: "01 Nov, 2026 03:15",
      timeAgo: "Il y a 1 semaine",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-3",
      username: "andres26",
      fullName: "Andr\u00e8s Kouam\u00e9",
      phone: "+22507456789",
      country: "IVORY COAST",
      date: "28 Oct, 2026 02:10",
      timeAgo: "Il y a 2 semaines",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-4",
      username: "ayram7326",
      fullName: "Ayram Dosseh",
      phone: "+22891567890",
      country: "TOGO",
      date: "22 Oct, 2026 01:39",
      timeAgo: "Il y a 3 semaines",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-5",
      username: "herman002",
      fullName: "Herman Agbessi",
      phone: "+22997443322",
      country: "BENIN",
      date: "16 Oct, 2026 10:54",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-6",
      username: "koffi28",
      fullName: "Koffi Amouzou",
      phone: "+22892112233",
      country: "TOGO",
      date: "14 Oct, 2026 08:30",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-7",
      username: "samirabk",
      fullName: "Samira Bakayoko",
      phone: "+22505332211",
      country: "IVORY COAST",
      date: "12 Oct, 2026 06:15",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-8",
      username: "moussa_bf",
      fullName: "Moussa Ouedraogo",
      phone: "+22676998877",
      country: "BURKINA FASO",
      date: "10 Oct, 2026 09:20",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-9",
      username: "fabrice_cm",
      fullName: "Fabrice Kamga",
      phone: "+23767554433",
      country: "CAMEROON",
      date: "08 Oct, 2026 09:54",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-10",
      username: "aicha_tg",
      fullName: "A\u00efcha Lawson",
      phone: "+22893445566",
      country: "TOGO",
      date: "06 Oct, 2026 04:40",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-11",
      username: "ibrahim_sn",
      fullName: "Ibrahim Diop",
      phone: "+22177123456",
      country: "SENEGAL",
      date: "04 Oct, 2026 10:53",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-12",
      username: "adjovi_bj",
      fullName: "Adjovi Hounkpati",
      phone: "+22995667788",
      country: "BENIN",
      date: "04 Oct, 2026 12:47",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-13",
      username: "paul_tg",
      fullName: "Paul Agbodjan",
      phone: "+22890778899",
      country: "TOGO",
      date: "02 Oct, 2026 07:18",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },
    {
      id: "ref-l1-14",
      username: "fatou_ci",
      fullName: "Fatoumata Bamba",
      phone: "+22501223344",
      country: "IVORY COAST",
      date: "01 Oct, 2026 02:45",
      timeAgo: "Il y a 1 mois",
      level: 1,
      amountPaid: 4500,
      commissionEarned: 2000,
      isActivated: true,
    },

    // --- NIVEAU 2 (8 membres, 1 000 FCFA chacun, Inscription 4 500 FCFA) ---
    {
      id: "ref-l2-1",
      username: "yao_eric",
      fullName: "Eric Yao",
      phone: "+22891223344",
      country: "TOGO",
      date: "05 Nov, 2026 11:20",
      timeAgo: "Il y a 1 semaine",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-2",
      username: "claudine_bf",
      fullName: "Claudine Sawadogo",
      phone: "+22671445566",
      country: "BURKINA FASO",
      date: "03 Nov, 2026 09:40",
      timeAgo: "Il y a 1 semaine",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-3",
      username: "boris_cm",
      fullName: "Boris Tagne",
      phone: "+23769112233",
      country: "CAMEROON",
      date: "29 Oct, 2026 04:15",
      timeAgo: "Il y a 2 semaines",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-4",
      username: "marc_ci",
      fullName: "Marc Djedje",
      phone: "+22507889900",
      country: "IVORY COAST",
      date: "25 Oct, 2026 12:30",
      timeAgo: "Il y a 3 semaines",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-5",
      username: "esther_bj",
      fullName: "Esther Dossou",
      phone: "+22996332211",
      country: "BENIN",
      date: "20 Oct, 2026 07:10",
      timeAgo: "Il y a 3 semaines",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-6",
      username: "serge_tg",
      fullName: "Serge Mensah",
      phone: "+22892445566",
      country: "TOGO",
      date: "15 Oct, 2026 02:45",
      timeAgo: "Il y a 1 mois",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-7",
      username: "salif_ml",
      fullName: "Salif Traor\u00e9",
      phone: "+22375112233",
      country: "MALI",
      date: "11 Oct, 2026 08:00",
      timeAgo: "Il y a 1 mois",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },
    {
      id: "ref-l2-8",
      username: "nadia_sn",
      fullName: "Nadia Ndiaye",
      phone: "+22178445566",
      country: "SENEGAL",
      date: "07 Oct, 2026 01:25",
      timeAgo: "Il y a 1 mois",
      level: 2,
      amountPaid: 4500,
      commissionEarned: 1000,
      isActivated: true,
    },

    // --- NIVEAU 3 (3 membres, 500 FCFA chacun, Inscription 4 500 FCFA) ---
    {
      id: "ref-l3-1",
      username: "prosper_tg",
      fullName: "Prosper Koudjo",
      phone: "+22890998877",
      country: "TOGO",
      date: "04 Nov, 2026 10:15",
      timeAgo: "Il y a 1 semaine",
      level: 3,
      amountPaid: 4500,
      commissionEarned: 500,
      isActivated: true,
    },
    {
      id: "ref-l3-2",
      username: "aline_ci",
      fullName: "Aline Konan",
      phone: "+22505112233",
      country: "IVORY COAST",
      date: "27 Oct, 2026 06:40",
      timeAgo: "Il y a 2 semaines",
      level: 3,
      amountPaid: 4500,
      commissionEarned: 500,
      isActivated: true,
    },
    {
      id: "ref-l3-3",
      username: "aziz_bf",
      fullName: "Aziz Compaor\u00e9",
      phone: "+22678223344",
      country: "BURKINA FASO",
      date: "18 Oct, 2026 03:50",
      timeAgo: "Il y a 4 semaines",
      level: 3,
      amountPaid: 4500,
      commissionEarned: 500,
      isActivated: true,
    },

    // --- INACTIFS (Personnes inscrites avec votre lien mais non encore activées) ---
    {
      id: "ref-inactif-1",
      username: "roland_tg",
      fullName: "Roland Amegah",
      phone: "+22890110022",
      country: "TOGO",
      date: "15 Nov, 2026 04:20",
      timeAgo: "Hier",
      level: 1,
      amountPaid: 0,
      commissionEarned: 0,
      isActivated: false,
    },
    {
      id: "ref-inactif-2",
      username: "grace_ci",
      fullName: "Gr\u00e2ce Kouassi",
      phone: "+22507123400",
      country: "IVORY COAST",
      date: "14 Nov, 2026 08:15",
      timeAgo: "Il y a 2 jours",
      level: 1,
      amountPaid: 0,
      commissionEarned: 0,
      isActivated: false,
    },
    {
      id: "ref-inactif-3",
      username: "issa_bf",
      fullName: "Issa Kabore",
      phone: "+22670990011",
      country: "BURKINA FASO",
      date: "12 Nov, 2026 02:40",
      timeAgo: "Il y a 4 jours",
      level: 1,
      amountPaid: 0,
      commissionEarned: 0,
      isActivated: false,
    },
    {
      id: "ref-inactif-4",
      username: "blaise_bj",
      fullName: "Blaise Gbaguidi",
      phone: "+22997001122",
      country: "BENIN",
      date: "10 Nov, 2026 09:10",
      timeAgo: "Il y a 6 jours",
      level: 1,
      amountPaid: 0,
      commissionEarned: 0,
      isActivated: false,
    },
  ];

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
        let l1Sum = 0;
        let l2Sum = 0;
        let l3Sum = 0;
        comms.forEach((c) => {
          const amt = Number(c.amount) || 0;
          if (c.level === 1) l1Sum += amt;
          else if (c.level === 2) l2Sum += amt;
          else if (c.level === 3) l3Sum += amt;
        });
        if (l1Sum > 0) level1Earned = l1Sum;
        if (l2Sum > 0) level2Earned = l2Sum;
        if (l3Sum > 0) level3Earned = l3Sum;
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
            timeAgo: "R\u00e9cent",
            level: 1,
            amountPaid: isAct ? 4500 : 0,
            commissionEarned: isAct ? 2000 : 0,
            isActivated: isAct,
          });
        });
      }
    }
  } catch {}

  // Combiner les vrais membres de la base de données avec l'ensemble d'exemples
  const allMembers = [...realMembers, ...sampleMembers];

  // Calculer les compteurs précis
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
