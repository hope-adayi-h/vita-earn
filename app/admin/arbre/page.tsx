import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, SUPER_ADMIN_EMAIL } from "@/lib/security/admin-lock";
import { getAllUsers } from "@/lib/auth/local-store";
import { ArbreClient, type TreeUserNode } from "./ArbreClient";

export const metadata = {
  title: "Arbre d'Affiliation — Administration Vita Earn",
};

export default async function AdminArbrePage() {
  const cookieStore = cookies();
  const supabase = createClient();

  let userEmail = "";
  let isAdmin = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || user.email === SUPER_ADMIN_EMAIL) {
        isAdmin = true;
      }
    }
  } catch {}

  if (!isAdmin) {
    const rawSession = cookieStore.get("vita_session_user")?.value;
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        if (parsed.role === "admin" || parsed.email === SUPER_ADMIN_EMAIL) {
          isAdmin = true;
        }
      } catch {}
    }
  }

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/arbre");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let treeNodes: TreeUserNode[] = [];

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone, is_activated");

      const { data: refs } = await adminClient
        .from("referrals")
        .select("referrer_id, referred_id");

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      treeNodes = (profiles || []).map((p) => {
        // Niveau 1
        const l1Ids = (refs || [])
          .filter((r) => r.referrer_id === p.id)
          .map((r) => r.referred_id);

        // Niveau 2
        const l2Ids = (refs || [])
          .filter((r) => l1Ids.includes(r.referrer_id))
          .map((r) => r.referred_id);

        // Niveau 3
        const l3Ids = (refs || [])
          .filter((r) => l2Ids.includes(r.referrer_id))
          .map((r) => r.referred_id);

        return {
          id: p.id,
          name: p.full_name || p.email?.split("@")[0] || "Membre",
          email: p.email || "",
          phone: p.phone || "",
          isActivated: Boolean(p.is_activated),
          l1: l1Ids.map((id) => {
            const m = profileMap.get(id);
            return {
              id,
              name: m?.full_name || "Filleul N1",
              isActivated: Boolean(m?.is_activated),
              phone: m?.phone || "",
            };
          }),
          l2: l2Ids.map((id) => {
            const m = profileMap.get(id);
            return {
              id,
              name: m?.full_name || "Filleul N2",
              isActivated: Boolean(m?.is_activated),
              phone: m?.phone || "",
            };
          }),
          l3: l3Ids.map((id) => {
            const m = profileMap.get(id);
            return {
              id,
              name: m?.full_name || "Filleul N3",
              isActivated: Boolean(m?.is_activated),
              phone: m?.phone || "",
            };
          }),
        };
      });
    } catch {}
  }

  if (treeNodes.length === 0) {
    const localUsers = getAllUsers();
    treeNodes = localUsers.map((u) => ({
      id: u.id,
      name: u.username,
      email: u.email,
      phone: u.phone,
      isActivated: u.isActivated,
      l1: [],
      l2: [],
      l3: [],
    }));
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8">
      <ArbreClient initialNodes={treeNodes} />
    </div>
  );
}
