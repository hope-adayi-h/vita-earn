import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { SasPayClient } from "@/lib/payments/saspay";

export const metadata = {
  title: "Paiement Confirmé — Vita Earn",
  description: "Statut de votre paiement d'activation de compte Vita Earn.",
};

export default async function SasPayCallbackPage({
  searchParams,
}: {
  searchParams?: { session_id?: string; transaction_id?: string };
}) {
  const sessionId = searchParams?.session_id || searchParams?.transaction_id || "";

  let isVerified = true;
  if (sessionId && process.env.SASPAY_API_KEY) {
    try {
      const client = new SasPayClient();
      const res = await client.verifyPayment(sessionId);
      if (res.status === "FAILED") {
        isVerified = false;
      }
    } catch {
      // Tolérance si la vérification réseau est différée vers le webhook
    }
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
            <span>Paiement Transmis & Enregistré</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Félicitations !
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            Votre paiement de 4 500 FCFA a été traité par SasPay. Votre compte Vita Earn est
            désormais actif et toutes les fonctionnalités (marketplace, affiliation 3 niveaux, retraits)
            vous sont immédiatement ouvertes.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/portefeuille"
            className="w-full touch-target py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>Accéder à mon portefeuille</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
