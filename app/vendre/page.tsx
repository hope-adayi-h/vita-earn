import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlusCircle, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Vendre un article — Vita Earn",
};

export default async function VendrePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/vendre");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_activated")
    .eq("id", user.id)
    .single();

  const isActivated = Boolean(profile?.is_activated);

  if (!isActivated) {
    return (
      <div className="max-w-xl mx-auto pt-6">
        <div className="bg-white rounded-2xl border border-vita-border p-6 sm:p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-vita-deep mb-2">
            Activation requise pour vendre
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted max-w-md mx-auto mb-6">
            Conformément aux règles de sécurité de Vita Earn, la publication d'articles
            (physiques ou digitaux) est strictement réservée aux comptes ayant validé leur activation.
          </p>
          <Link
            href="/activation"
            className="touch-target px-6 py-3 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>Activer mon compte vendeur</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-2 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vita-deep tracking-tight">
          Espace Vendeur — Publier un article
        </h1>
        <p className="text-xs sm:text-sm text-vita-muted">
          Votre compte est activé ! Préparez la mise en vente de vos articles.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-vita-border p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-vita-surface border border-vita-border flex items-center justify-center mx-auto mb-4 text-vita-deep">
          <PlusCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-vita-deep mb-2">
          Formulaire de publication (Étape 3)
        </h2>
        <p className="text-xs sm:text-sm text-vita-muted max-w-md mx-auto mb-6">
          La gestion des boutiques et le téléchargement des fichiers digitaux sécurisés
          seront activés à l'étape 3 du MVP.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          Compte vendeur activé et autorisé
        </div>
      </div>
    </div>
  );
}
