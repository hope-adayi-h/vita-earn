"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/auth/actions";
import { Logo3D } from "@/components/Logo3D";
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

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
          <span>Envoi en cours...</span>
        </div>
      ) : (
        <>
          <span>Envoyer le lien de réinitialisation</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, null);

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12 px-2">
      <div className="bg-white rounded-3xl border border-vita-border/80 p-6 sm:p-10 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-vita-deep via-vita-medium to-vita-bright" />

        <div className="text-center mb-8 relative z-10">
          <Logo3D size="md" className="mb-4" />

          <h1 className="text-2xl sm:text-3xl font-extrabold text-vita-deep tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted mt-2 max-w-xs mx-auto leading-relaxed">
            Saisissez l'adresse e-mail associée à votre compte Vita Earn pour recevoir un
            lien sécurisé de réinitialisation.
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
            <span className="font-medium">{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-bold mb-1">E-mail envoyé !</p>
              <p className="text-xs text-green-900 leading-relaxed">{state.message}</p>
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Adresse e-mail du compte
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="nom@exemple.com"
                className="w-full touch-target rounded-xl border border-vita-border bg-vita-surface/50 pl-10 pr-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:border-vita-medium focus:bg-white focus:ring-2 focus:ring-vita-bright/30 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-vita-border/80 text-center relative z-10">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-vita-muted hover:text-vita-deep transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la page de connexion</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
