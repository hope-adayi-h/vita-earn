import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  LogOut,
  ShoppingBag,
  Wallet,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Mon Profil — Vita Earn",
};

export default async function ProfilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/profil");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isActivated = Boolean(profile?.is_activated);

  return (
    <div className="max-w-xl mx-auto pt-2 sm:pt-6 space-y-6">
      {/* Carte utilisateur */}
      <div className="bg-white rounded-2xl border border-vita-border p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-vita-surface border border-vita-border flex items-center justify-center text-vita-deep font-bold text-xl">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-vita-deep leading-tight">
                {profile?.full_name || "Utilisateur Vita Earn"}
              </h1>
              <p className="text-xs text-vita-muted mt-0.5">{user.email}</p>
            </div>
          </div>

          <div>
            {isActivated ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-vita-deep">
                <ShieldCheck className="w-3.5 h-3.5 text-vita-deep" />
                Compte Activé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Non activé
              </span>
            )}
          </div>
        </div>

        {/* Alerte si non activé */}
        {!isActivated && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Votre compte n'est pas encore activé
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Activez votre compte pour vendre et demander des retraits.
                </p>
              </div>
            </div>
            <Link
              href="/activation"
              className="touch-target px-3.5 py-1.5 rounded-lg bg-vita-deep text-white text-xs font-semibold hover:bg-vita-medium transition-colors whitespace-nowrap"
            >
              Activer maintenant
            </Link>
          </div>
        )}

        {/* Détails du compte */}
        <div className="space-y-3.5 text-xs sm:text-sm border-t border-vita-border pt-5">
          <div className="flex items-center justify-between py-1">
            <span className="text-vita-muted flex items-center gap-2">
              <User className="w-4 h-4" /> Nom complet
            </span>
            <span className="font-semibold text-vita-text">
              {profile?.full_name || "Non renseigné"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-vita-muted flex items-center gap-2">
              <Mail className="w-4 h-4" /> Adresse e-mail
            </span>
            <span className="font-semibold text-vita-text">{user.email}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-vita-muted flex items-center gap-2">
              <Phone className="w-4 h-4" /> Téléphone
            </span>
            <span className="font-semibold text-vita-text">
              {profile?.phone || "Non renseigné"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-vita-muted flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Rôle
            </span>
            <span className="font-semibold capitalize text-vita-text">
              {profile?.role || "user"}
            </span>
          </div>
        </div>

        {/* Raccourcis */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-vita-border">
          <Link
            href="/portefeuille"
            className="touch-target p-3 rounded-xl bg-vita-surface hover:bg-white border border-vita-border transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-vita-deep"
          >
            <Wallet className="w-4 h-4" />
            <span>Mon portefeuille</span>
          </Link>
          <Link
            href="/vendre"
            className="touch-target p-3 rounded-xl bg-vita-surface hover:bg-white border border-vita-border transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-vita-deep"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Espace Vendeur</span>
          </Link>
        </div>

        {/* Déconnexion */}
        <div className="mt-6 pt-4 border-t border-vita-border text-center">
          <form action={signOutAction}>
            <button
              type="submit"
              className="touch-target px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
