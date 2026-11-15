"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/app/auth/actions";
import type { ActionResponse } from "@/app/auth/types";
import { Logo3D } from "@/components/Logo3D";
import { TermsAccordion } from "@/components/TermsAccordion";
import { CountrySelect, type Country } from "@/components/CountrySelect";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const rawUpline = searchParams.get("ref") || searchParams.get("upline");
  const hasUpline = Boolean(rawUpline && rawUpline.trim().length > 0);
  const uplineValue = hasUpline ? rawUpline!.trim() : "Aucun";

  // Par défaut sur Rien (null) selon la demande de l'utilisateur
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionResponse | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCountry) {
      setState({
        error: "Veuillez sélectionner votre pays de résidence.",
        fieldErrors: { country: "Veuillez sélectionner votre pays de résidence." },
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("country", selectedCountry.name);
    // Préfixer le numéro avec l'indicatif choisi
    const rawPhone = formData.get("phone") as string;
    const computedPhone = rawPhone && !rawPhone.startsWith("+")
      ? `${selectedCountry.dialCode} ${rawPhone.trim()}`
      : rawPhone?.trim() || "";
    if (computedPhone) {
      formData.set("phone", computedPhone);
      try {
        localStorage.setItem("vita_registered_phone", computedPhone);
      } catch {}
    }
    formData.set("upline", uplineValue);
    formData.set("termsAccepted", termsAccepted ? "true" : "false");

    startTransition(async () => {
      const res = await signUpAction(null, formData);
      setState(res);
    });
  };

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="max-w-lg mx-auto py-4 sm:py-8 px-2">
      {/* Carte d'inscription principale */}
      <div className="bg-white rounded-3xl border border-vita-border/80 p-6 sm:p-10 shadow-xl relative overflow-hidden backdrop-blur-sm">
        {/* Décoration d'arrière-plan avec les couleurs de la marque */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-vita-deep via-vita-medium to-vita-bright" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-vita-bright/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-vita-deep/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header avec Logo 3D Animé compact */}
        <div className="text-center mb-6 relative z-10">
          <Logo3D size="md" className="mb-3" />

          <h1 className="text-xl sm:text-2xl font-extrabold text-vita-deep tracking-tight">
            Bienvenue sur Vita Earn
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted mt-1 max-w-sm mx-auto">
            Créez votre compte en toute sécurité.
          </p>
        </div>

        {/* Message d'erreur serveur */}
        {state?.error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
            <div className="space-y-0.5">
              <p className="font-semibold">{state.error}</p>
              {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-red-600 space-y-0.5 pt-1">
                  {Object.entries(state.fieldErrors).map(([key, msg]) => (
                    <li key={key}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Message de succès */}
        {state?.success && (
          <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-bold mb-1">Compte créé avec succès !</p>
              <p className="text-xs text-green-900 leading-relaxed">{state.message}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/activation"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-vita-bright" />
                  <span>Activer mon compte (4 500 FCFA)</span>
                </Link>
                <Link
                  href="/marche"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-vita-surface border border-vita-border text-vita-deep font-semibold text-xs transition-colors"
                >
                  <span>Je suis acheteur — Voir le marché</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire complet de A à Z */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* 1. Enter Email */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Adresse e-mail
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="Entrer adresse email"
                className="w-full touch-target rounded-xl border border-vita-border bg-vita-surface/50 px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:border-vita-medium focus:bg-white focus:ring-2 focus:ring-vita-bright/30 transition-all shadow-sm"
              />
            </div>
            {state?.fieldErrors?.email && (
              <p className="text-[11px] text-red-600 mt-1">{state.fieldErrors.email}</p>
            )}
          </div>

          {/* 2. Enter Username */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="Entrer nom d'utilisateur"
                className="w-full touch-target rounded-xl border border-vita-border bg-vita-surface/50 px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:border-vita-medium focus:bg-white focus:ring-2 focus:ring-vita-bright/30 transition-all shadow-sm"
              />
            </div>
            {state?.fieldErrors?.username && (
              <p className="text-[11px] text-red-600 mt-1">{state.fieldErrors.username}</p>
            )}
          </div>

          {/* 3. Select Country avec drapeaux visibles garantis */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Pays de résidence
            </label>
            <CountrySelect
              value={selectedCountry}
              onChange={(c) => setSelectedCountry(c)}
              error={state?.fieldErrors?.country}
            />
            {state?.fieldErrors?.country && (
              <p className="text-[11px] text-red-600 mt-1">{state.fieldErrors.country}</p>
            )}
          </div>

          {/* 4. Phone Number avec indicatif synchronisé instantanément */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Numéro de téléphone
            </label>
            <div className="flex rounded-xl border border-vita-border bg-vita-surface/50 overflow-hidden focus-within:border-vita-medium focus-within:bg-white focus-within:ring-2 focus-within:ring-vita-bright/30 transition-all shadow-sm">
              <span className="inline-flex items-center gap-1 px-3 bg-white/70 border-r border-vita-border text-xs font-semibold text-vita-deep select-none">
                <Phone className="w-3.5 h-3.5 text-vita-muted" />
                <span className="font-mono">
                  {selectedCountry ? selectedCountry.dialCode : "+..."}
                </span>
              </span>
              <input
                type="tel"
                name="phone"
                required
                placeholder="Entrez le numéro de téléphone"
                className="flex-1 touch-target bg-transparent px-3 text-xs sm:text-sm text-vita-text focus:outline-none"
              />
            </div>
            {state?.fieldErrors?.phone && (
              <p className="text-[11px] text-red-600 mt-1">{state.fieldErrors.phone}</p>
            )}
          </div>

          {/* 5. Parrain */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Parrain
            </label>
            <div className="relative">
              <input
                type="text"
                name="upline"
                value={uplineValue}
                readOnly
                tabIndex={-1}
                className="w-full touch-target rounded-xl border border-vita-border bg-gray-100/90 px-3.5 text-xs sm:text-sm text-gray-700 font-semibold cursor-not-allowed select-none focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* 6. Enter Password */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                placeholder="Au moins 6 caractères"
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
            {state?.fieldErrors?.password && (
              <p className="text-[11px] text-red-600 mt-1">{state.fieldErrors.password}</p>
            )}
          </div>

          {/* 7. Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                placeholder="Répétez le mot de passe"
                className={`w-full touch-target rounded-xl border bg-vita-surface/50 pl-10 pr-10 text-xs sm:text-sm text-vita-text focus:outline-none focus:bg-white focus:ring-2 transition-all shadow-sm ${
                  passwordsMismatch
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : passwordsMatch
                    ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                    : "border-vita-border focus:border-vita-medium focus:ring-vita-bright/30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vita-muted hover:text-vita-text p-1 transition-colors"
                aria-label={showConfirmPassword ? "Masquer" : "Afficher"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordsMismatch && (
              <p className="text-[11px] text-red-600 mt-1">
                Les mots de passe ne correspondent pas.
              </p>
            )}
            {passwordsMatch && (
              <p className="text-[11px] text-green-700 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Les mots de passe correspondent parfaitement.
              </p>
            )}
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-[11px] text-red-600 mt-1">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* 8. Conditions d'utilisation - Accordéon & Validation */}
          <div className="pt-2">
            <TermsAccordion
              checked={termsAccepted}
              onChange={setTermsAccepted}
              error={state?.fieldErrors?.termsAccepted}
            />
          </div>

          {/* 9. Bouton Soumettre avec animation 3D et shimmer */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isPending || !termsAccepted}
              className="w-full touch-target rounded-2xl bg-gradient-to-r from-vita-deep via-vita-medium to-[#236014] hover:from-vita-medium hover:to-vita-deep text-white font-bold text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group animate-shimmer"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Création de votre compte...</span>
                </div>
              ) : (
                <>
                  <span>Créer mon compte Vita Earn</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* 10. Note de sécurité */}
          <div className="pt-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vita-surface text-[11px] text-vita-muted font-medium border border-vita-border/60">
              <Shield className="w-3.5 h-3.5 text-vita-medium" />
              <span>Vos informations sont sécurisées et ne seront jamais partagées.</span>
            </div>
          </div>
        </form>

        {/* Lien de redirection vers la page de connexion */}
        <div className="mt-8 pt-6 border-t border-vita-border/80 text-center relative z-10">
          <p className="text-xs sm:text-sm text-vita-muted">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="font-bold text-vita-deep hover:text-vita-medium transition-colors underline decoration-vita-medium/40 underline-offset-2"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-12 px-4 text-center">
          <div className="w-10 h-10 border-4 border-vita-medium border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-vita-muted font-medium">
            Chargement de la page d'inscription...
          </p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
