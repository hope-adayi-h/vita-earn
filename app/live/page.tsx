import { cookies } from "next/headers";
import Link from "next/link";
import { ChevronLeft, Video } from "lucide-react";
import {
  getAllLiveConferences,
  getUserSubscribedLiveIds,
  getLiveSettings,
  getWeekLiveStats,
} from "@/lib/data/live-store";
import { LiveClient } from "./LiveClient";

export const metadata = {
  title: "Conférences & Formations Live — Vita Earn",
  description: "Participez aux conférences et formations en direct ou proposez votre propre événement en ligne.",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  const testUser = cookieStore.get("vita_test_user")?.value;

  let currentUser: { id: string; identifier: string; name: string; isActivated: boolean } = {
    id: "visitor",
    identifier: "visitor",
    name: "Visiteur",
    isActivated: false,
  };

  if (sessionUserCookie) {
    try {
      const parsed = JSON.parse(sessionUserCookie);
      currentUser = {
        id: String(parsed.id || parsed.username || "user"),
        identifier: String(parsed.email || parsed.username || parsed.id || "user"),
        name: String(parsed.fullName || parsed.username || ""),
        isActivated: Boolean(parsed.isActivated),
      };
    } catch {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionUserCookie));
        currentUser = {
          id: String(parsed.id || parsed.username || "user"),
          identifier: String(parsed.email || parsed.username || parsed.id || "user"),
          name: String(parsed.fullName || parsed.username || ""),
          isActivated: Boolean(parsed.isActivated),
        };
      } catch {}
    }
  } else if (testUser) {
    currentUser = {
      id: testUser,
      identifier: testUser,
      name: testUser,
      isActivated: true,
    };
  }

  const allLives = await getAllLiveConferences();
  const userSubscribedIds = await getUserSubscribedLiveIds(currentUser.identifier);
  const settings = await getLiveSettings();
  const weekStats = await getWeekLiveStats();

  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4D0F] hover:underline min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              Live & Webinaire
            </span>
          </div>
        </div>

        {/* Titre et introduction */}
        <div className="bg-white rounded-[28px] p-5 sm:p-7 shadow-xs border border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#14201A] tracking-tight">
                Espace Conférences & Formations Live
              </h1>
              <p className="text-xs sm:text-sm text-[#5B6B60]">
                Suivez les webinaires en direct sur Google Meet ou proposez votre session à la communauté
              </p>
            </div>
          </div>
        </div>

        {/* Client interactif */}
        <LiveClient
          lives={allLives}
          initialSubscribedIds={userSubscribedIds}
          currentUser={currentUser}
          initialSettings={settings}
          initialWeekStats={weekStats}
        />
      </div>
    </div>
  );
}
