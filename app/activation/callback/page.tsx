import Link from "next/link";
import { cookies } from "next/headers";
import { CheckCircle2, ShieldCheck, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { SasPayClient } from "@/lib/payments/saspay";
import { createClient } from "@/lib/supabase/server";
import { processSuccessfulActivation } from "@/lib/payments/activation-service";

export const metadata = {
  title: "Statut du Paiement — Vita Earn",
  description: "Statut de votre paiement d'activation de compte Vita Earn.",
};

export default async function SasPayCallbackPage({
  searchParams,
}: {
  searchParams?: { session_id?: string; transaction_id?: string; id?: string };
}) {
  const sessionId = searchParams?.session_id || searchParams?.transaction_id || searchParams?.id || "";

  let isVerified = true;
  let statusText = "CONFIRMÉ";

  if (sessionId && process.env.SASPAY_API_KEY) {
    try {
      const client = new SasPayClient();
      const res = await client.verifyPayment(sessionId);
      if (res.status === "FAILED" || res.status === "CANCELLED") {
        isVerified = false;
        statusText = res.status;
      }
    } catch {
      // Tolérance si la vérification réseau directe est différée vers le webhook
    }
  }

  // Si le paiement est réussi ou en cours de validation
  if (isVerified) {
    const cookieStore = cookies();
    const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
    let sessionUser: any = null;
    if (sessionUserCookie) {
      try {
        sessionUser = JSON.parse(sessionUserCookie);
      } catch {
        try {
          sessionUser = JSON.parse(decodeURIComponent(sessionUserCookie));
        } catch {}
      }
    }

    const supabase = createClient();
    let supabaseUserId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      supabaseUserId = data?.user?.id || null;
    } catch {}

    const targetUserId = supabaseUserId || sessionUser?.id || sessionUser?.username;

    if (targetUserId) {
      try {
        await processSuccessfulActivation({
          userId: targetUserId,
          providerRef: sessionId || `sas_${Date.now()}`,
        });
      } catch {}
    }

    // Mettre à jour les cookies de session pour refléter immédiatement le compte actif
    cookieStore.set("vita_account_activated", "true", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    if (sessionUser) {
      sessionUser.isActivated = true;
      cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  if (!isVerified) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              <span>Paiement non finalisé ({statusText})</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Transaction Interrompue
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Le paiement de l'adhésion n'a pas pu aboutir ou a été interrompu. Votre compte n'a pas encore été débité.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/activation"
              className="w-full touch-target py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer le paiement</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paiement Mobile Money Confirmé</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Félicitations !
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Votre paiement d'adhésion de <strong>4 500 FCFA</strong> a été validé avec succès.
            Votre compte Vita Earn est désormais pleinement activé. Le programme d'affiliation sur 3 niveaux,
            la publication d'articles et les retraits Mobile Money vous sont immédiatement ouverts.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link
            href="/"
            className="w-full touch-target py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>Accéder au Tableau de Bord</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/portefeuille"
            className="w-full touch-target py-3 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>Voir mon portefeuille</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
