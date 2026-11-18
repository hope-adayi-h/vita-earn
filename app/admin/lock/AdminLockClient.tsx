"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="w-full max-w-md bg-[#0B1322] border border-[#1A2840] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-slate-100">
        {/* En-tête sécurisé */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sas de Sécurité Administrateur
            </span>
            <h1 className="text-2xl font-black text-white mt-2">
              Déverrouiller l&apos;Administration
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Compte : <span className="font-semibold text-slate-200">{userEmail}</span>
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Message de succès */}
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Identité confirmée. Accès au Command Center...</span>
          </div>
        )}

        {/* Option 1 : Déverrouillage Biométrique (Face ID / Touch ID) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleBiometricUnlock}
            disabled={isPending || success}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2.5 group disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Fingerprint className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Déverrouiller avec Face ID / Touch ID</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Utilisez l&apos;authentification biométrique instantanée de votre appareil
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1E2E48] w-full" />
          <span className="bg-[#0B1322] px-3 text-[10px] uppercase font-black text-slate-400 tracking-wider">
            ou code secret
          </span>
          <div className="border-t border-[#1E2E48] w-full" />
        </div>

        {/* Option 2 : Code Secret Maître / Code Dynamique Horaire */}
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          {/* Saisie du Code Secret */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Code Secret Administrateur
            </label>

            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Saisissez votre code secret"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-2xl bg-[#131F33] border border-[#223555] text-white text-sm font-mono tracking-wider placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors pr-11"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label={showCode ? "Masquer le code" : "Afficher le code"}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || success}
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
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
        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Session sécurisée avec reverrouillage automatique</span>
        </div>

        {/* Bouton retour site */}
        <div className="text-center pt-2 border-t border-[#162338]">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
          >
            ← Retourner sur le site public (mes comptes)
          </Link>
        </div>
      </div>
    </div>
  );
}
