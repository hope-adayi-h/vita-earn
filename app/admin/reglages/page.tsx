import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { getSupportSettingsAction } from "@/lib/actions/support";
import { ReglagesClient } from "./ReglagesClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Réglages Plateforme — Administration Vita Earn",
};

export default async function AdminReglagesPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

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
  let withdrawalFeePercent = 5;

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
          if (s.key === "withdrawal_fee_percent" && s.value?.percent) {
            withdrawalFeePercent = Number(s.value.percent);
          }
        });
      }
    } catch {}
  }

  const support = await getSupportSettingsAction();

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />
      <ReglagesClient
        initialSettings={{
          activationFee,
          l1,
          l2,
          l3,
          platformMargin,
          minWithdrawal,
          withdrawalFeePercent,
          whatsapp: "+228 90 00 00 00",
          telegram: support.telegram || "https://t.me/vitaearn_officiel",
          email: support.email || "contact@vitaearn.com",
        }}
      />
    </div>
  );
}
