import Link from "next/link";
import { Briefcase, ChevronLeft, ShieldCheck } from "lucide-react";
import { fetchAndSyncEmploiPosts } from "@/lib/data/emploi-store";
import { EmploiClient } from "./EmploiClient";

export const metadata = {
  title: "Emploi & Talents — Vita Earn",
  description: "Publiez votre profil professionnel et découvrez les services des membres Vita Earn.",
};

export const dynamic = "force-dynamic";

export default async function EmploiPage() {
  const posts = await fetchAndSyncEmploiPosts();

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
                Présentez votre métier, vos services ou vos créations à la communauté
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#F4F7F0] rounded-2xl border border-[#1B4D0F]/15 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2F7A1A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#14201A] leading-relaxed font-medium">
              Publiez gratuitement votre profil professionnel avec votre photo, votre spécialité et le lien vers vos services.
            </p>
          </div>

          <EmploiClient initialPosts={posts} />
        </div>
      </div>
    </div>
  );
}
