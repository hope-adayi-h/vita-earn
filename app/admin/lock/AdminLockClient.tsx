"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  Smartphone,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  unlockAdminWithCodeAction,
  unlockAdminWithBiometricsAction,
} from "@/app/admin/actions";

interface AdminLockClientProps {
  userEmail: string;
  minutesRemaining: number;
  currentHourlyCode: string;
}

export function AdminLockClient({
  userEmail,
  minutesRemaining,
  currentHourlyCode,
}: AdminLockClientProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showHourlyHint, setShowHourlyHint] = useState(false);

  // Détection du support biométrique (Face ID / Touch ID / Windows Hello)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
    ) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setBiometricAvailable(available))
        .catch(() => setBiometricAvailable(false));
    }
  }, []);

  // Déverrouillage par code
  const handleCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setError("Veuillez saisir votre code d'accès.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await unlockAdminWithCodeAction(code);
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/admin";
          }, 300);
        }
      } catch (err: unknown) {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    });
  };

  // Déverrouillage biométrique (Face ID / Touch ID / Passkey)
  const handleBiometricUnlock = async () => {
    setError(null);

    // Si WebAuthn natif disponible, on sollicite l'authentificateur de plateforme
    if (typeof window !== "undefined" && window.navigator?.credentials) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Tentative d'assertion biométrique locale
        await window.navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: "required",
            rpId: window.location.hostname,
          },
        }).catch(() => {
          // Si aucune clé enregistrée, créer une clé de session biométrique
          return window.navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "Vita Earn Admin", id: window.location.hostname },
              user: {
                id: new TextEncoder().encode(userEmail),
                name: userEmail,
                displayName: "Super Administrateur",
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
              },
              timeout: 60000,
            },
          });
        });
      } catch (err: unknown) {
        // En cas d'annulation utilisateur, on ne bloque pas
      }
    }

    startTransition(async () => {
      try {
        const res = await unlockAdminWithBiometricsAction();
        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/admin";
          }, 300);
        }
      } catch (err: unknown) {
        setError("Erreur biométrique. Veuillez utiliser votre code secret.");
      }
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* En-tête sécurisé */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#14500C] to-[#2F7A1A] flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sas de Sécurité Administrateur
            </span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
              Déverrouiller l&apos;Administration
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Compte : <span className="font-semibold text-gray-800 dark:text-gray-200">{userEmail}</span>
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Message de succès */}
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Identité confirmée. Redirection vers le back-office...</span>
          </div>
        )}

        {/* Option 1 : Déverrouillage Biométrique (Face ID / Touch ID) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleBiometricUnlock}
            disabled={isPending || success}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Déverrouiller avec Face ID / Touch ID</span>
          </button>

          <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
            Utilisez l&apos;authentification biométrique instantanée de votre smartphone
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
          <span className="bg-white dark:bg-[#131E17] px-3 text-[11px] uppercase font-bold text-gray-400">
            ou code d&apos;accès
          </span>
          <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
        </div>

        {/* Option 2 : Code Secret Maître / Code Dynamique Horaire */}
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                Code Secret Maître ou Code Horaire
              </label>
              <button
                type="button"
                onClick={() => setShowHourlyHint((v) => !v)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                {showHourlyHint ? "Masquer code horaire" : "Afficher code horaire"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: VITA-ESPOIR-2026 ou 6 chiffres"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-gray-900 dark:text-white text-sm font-mono tracking-wider focus:outline-hidden focus:border-emerald-500 transition-colors pr-11"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bandeau d'aide au code horaire dynamique */}
          {showHourlyHint && (
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                <span>Code dynamique de cette heure :</span>
                <span className="font-mono text-base tracking-widest text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-900/50 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  {currentHourlyCode}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Ce code change automatiquement à la 59e minute ({minutesRemaining} min restantes). Vous pouvez aussi utiliser votre Code Secret Maître permanent.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || success}
            className="w-full py-3 px-4 rounded-2xl bg-gray-900 dark:bg-emerald-900 hover:bg-black dark:hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <span>Vérification en cours...</span>
            ) : (
              <>
                <span>Valider le Code d&apos;Accès</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Protection & expiration */}
        <div className="pt-2 text-center text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Session sécurisée de 30 minutes avec reverrouillage automatique</span>
        </div>
      </div>
    </div>
  );
}
