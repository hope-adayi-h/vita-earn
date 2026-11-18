import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession, SUPER_ADMIN_EMAIL } from "@/lib/security/admin-lock";
import { JournalClient, type AuditLogItem } from "./JournalClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Journal d'Audit — Administration Vita Earn",
};

export default async function AdminJournalPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/journal");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let logs: AuditLogItem[] = [];

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: rawLogs } = await adminClient
        .from("audit_logs")
        .select("id, user_id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (rawLogs && rawLogs.length > 0) {
        const userIds = Array.from(new Set(rawLogs.map((l) => l.user_id).filter(Boolean)));
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        logs = rawLogs.map((l) => {
          const p = l.user_id ? profileMap.get(l.user_id) : null;
          return {
            id: l.id,
            action: l.action,
            userName: p?.full_name || "Admin",
            userEmail: p?.email || SUPER_ADMIN_EMAIL,
            entityType: l.entity_type,
            createdAt: l.created_at,
          };
        });
      }
    } catch {}
  }

  if (logs.length === 0) {
    logs = [
      {
        id: "log_initial",
        action: "admin_unlocked_with_code",
        userName: "Espoir",
        userEmail: SUPER_ADMIN_EMAIL,
        entityType: "admin_session",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />
      <JournalClient logs={logs} />
    </div>
  );
}
