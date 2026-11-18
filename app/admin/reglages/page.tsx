import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, SUPER_ADMIN_EMAIL } from "@/lib/security/admin-lock";
import { getSupportSettingsAction } from "@/lib/actions/support";
import { ReglagesClient } from "./ReglagesClient";

export const metadata = {
  title: "Réglages Plateforme — Administration Vita Earn",
};

export default async function AdminReglagesPage() {
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
    redirect("/auth/login?redirect=/admin/reglages");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let activationFee = 4500;
  let l1 = 2000;
  let l2 = 1000;
  let l3 = 500;
  let platformMargin = 1000;
  let minWithdrawal = 1000;

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: settings } = await adminClient
        .from("platform_settings")
        .select("key, value");

      if (settings) {
        settings.forEach((s) => {
          if (s.key === "activation_fee" && s.value?.amount) {
            activationFee = Number(s.value.amount);
          }
          if (s.key === "subscription_commissions" && s.value) {
            if (s.value.l1) l1 = Number(s.value.l1);
            if (s.value.l2) l2 = Number(s.value.l2);
            if (s.value.l3) l3 = Number(s.value.l3);
            if (s.value.platform_margin) platformMargin = Number(s.value.platform_margin);
          }
          if (s.key === "withdrawal_settings" && s.value?.min_amount) {
            minWithdrawal = Number(s.value.min_amount);
          }
        });
      }
    } catch {}
  }

  const support = await getSupportSettingsAction();

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <ReglagesClient
        initialSettings={{
          activationFee,
          l1,
          l2,
          l3,
          platformMargin,
          minWithdrawal,
          whatsapp: "+228 90 00 00 00",
          telegram: support.telegram || "https://t.me/vitaearn_officiel",
          email: support.email || "contact@vitaearn.com",
        }}
      />
    </div>
  );
}
