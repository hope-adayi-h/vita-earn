"use client";

import { useState, useEffect, Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInAction } from "@/app/auth/actions";
import { Logo3D } from "@/components/Logo3D";
import { Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, Shield } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full touch-target rounded-2xl bg-gradient-to-r from-vita-deep via-vita-medium to-[#236014] hover:from-vita-medium hover:to-vita-deep text-white font-bold text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group animate-shimmer"
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connexion en cours...</span>
        </div>
      ) : (
        <>
          <span>Se connecter</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}

function LoginForm() {
  const [state, formAction] = useFormState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();

  const rawSponsor = searchParams.get("sponsor") || searchParams.get("ref");
  let redirectSponsor = "";
  const redirectParam = searchParams.get("redirect");
  if (redirectParam && redirectParam.includes("/register/")) {
    redirectSponsor = redirectParam.split("/register/")[1]?.split("?")[0]?.split("/")[0] || "";
  }
  const detectedSponsor = (rawSponsor || redirectSponsor || "").replace(/^@/, "").trim();

  const [persistedSponsor, setPersistedSponsor] = useState(detectedSponsor);

  useEffect(() => {
    if (detectedSponsor) {
      setPersistedSponsor(detectedSponsor);
      try {
        localStorage.setItem("vita_pending_sponsor", detectedSponsor);
      } catch {}
    } else {
      try {
        const stored = localStorage.getItem("vita_pending_sponsor");
        if (stored) setPersistedSponsor(stored);
      } catch {}
    }
  }, [detectedSponsor]);

  const registerHref = persistedSponsor
    ? `/auth/register?sponsor=${encodeURIComponent(persistedSponsor)}`
    : "/auth/register";

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 px-2">
      <div className="bg-white rounded-3xl border border-vita-border/80 p-6 sm:p-10 shadow-xl relative overflow-hidden backdrop-blur-sm">
        {/* Liseré haut brand */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-vita-deep via-vita-medium to-vita-bright" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-vita-bright/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header avec Logo 3D */}
        <div className="text-center mb-6 relative z-10">
          <Logo3D size="md" className="mb-3" />

          <h1 className="text-xl sm:text-2xl font-extrabold text-vita-deep tracking-tight">
            Bon retour
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted mt-1 max-w-xs mx-auto">
            Connectez-vous à votre compte en toute sécurité.
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
            <span className="font-medium">{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-4 relative z-10">
          {redirectParam && (
            <input type="hidden" name="redirect" value={redirectParam} />
          )}

          {/* Nom d'utilisateur ou adresse e-mail */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Nom d'utilisateur ou E-mail
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type="text"
                name="identifier"
                required
                autoComplete="username"
                placeholder="Entrer ton nom d'utilisateur ou email"
                className="w-full touch-target rounded-xl border border-vita-border bg-vita-surface/50 pl-10 pr-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:border-vita-medium focus:bg-white focus:ring-2 focus:ring-vita-bright/30 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="mb-1.5">
              <label className="block text-xs font-bold text-vita-text uppercase tracking-wider">
                Mot de passe
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full touch-target rounded-xl border border-vita-border bg-vita-surface/50 pl-10 pr-10 text-xs sm:text-sm text-vita-text focus:outline-none focus:border-vita-medium focus:bg-white focus:ring-2 focus:ring-vita-bright/30 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vita-muted hover:text-vita-text p-1 transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <SubmitButton />
          </div>

          <div className="pt-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vita-surface text-[10px] text-vita-muted font-medium border border-vita-border/60">
              <Shield className="w-3 h-3 text-vita-medium" />
              <span>Connexion sécurisée SSL chiffrée</span>
            </div>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-vita-border/80 text-center relative z-10">
          <p className="text-xs sm:text-sm text-vita-muted">
            Pas encore de compte sur la plateforme ?{" "}
            <Link
              href={registerHref}
              className="font-bold text-vita-deep hover:text-vita-medium transition-colors underline decoration-vita-medium/40 underline-offset-2"
            >
              Créer mon compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-12 text-center text-xs text-vita-muted">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
