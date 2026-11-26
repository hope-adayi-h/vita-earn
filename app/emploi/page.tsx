import Link from "next/link";
import { cookies } from "next/headers";
import { Briefcase, ChevronLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { findUserByIdentifier } from "@/lib/auth/local-store";
import { fetchAndSyncEmploiPosts } from "@/lib/data/emploi-store";
import { EmploiClient } from "./EmploiClient";

export const metadata = {
  title: "Emploi & Talents — Vita Earn",
  description: "Publiez votre profil professionnel et découvrez les services des membres Vita Earn.",
};

export const dynamic = "force-dynamic";

export default async function EmploiPage() {
  const cookieStore = cookies();
  const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
  const testUser = cookieStore.get("vita_test_user")?.value;

  let currentUserId = "";
  if (sessionUserRaw) {
    try {
      const parsed = JSON.parse(sessionUserRaw);
      currentUserId = String(parsed?.id || parsed?.username || "");
    } catch {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionUserRaw));
        currentUserId = String(parsed?.id || parsed?.username || "");
      } catch {}
    }
  } else if (testUser) {
    const localU = findUserByIdentifier(testUser);
    currentUserId = localU?.id || testUser;
  }

  const postsPromise = fetchAndSyncEmploiPosts();

  if (!currentUserId) {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
    if (isConfigured) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) currentUserId = user.id;
      } catch {}
    }
  }

  const posts = await postsPromise;

  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4D0F] hover:underline min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <span className="text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/25 px-3 py-1 rounded-full">
            {posts.length} profil(s) publié(s)
          </span>
        </div>

        <div className="bg-white rounded-[28px] p-5 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4D0F] text-[#7ED321] flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#14201A]">Espace Emploi</h1>
              <p className="text-xs sm:text-sm text-[#5B6B60]">
                Présentez votre métier, vos services et votre contact (1 publication par compte)
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#F4F7F0] rounded-2xl border border-[#1B4D0F]/15 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2F7A1A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#14201A] leading-relaxed font-medium">
              Chaque compte peut publier <strong>un seul profil professionnel</strong> avec sa photo, son numéro de téléphone et ses services, modifiable à tout moment.
            </p>
          </div>

          <EmploiClient initialPosts={posts} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
