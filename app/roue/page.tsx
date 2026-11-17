"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ChevronLeft, ShieldCheck, CheckCircle2, RotateCw } from "lucide-react";
import {
  DEFAULT_WHEEL_SEGMENTS,
  WheelSegment,
} from "@/lib/wheel-constants";
import {
  getDailySpinStatusAction,
  spinWheelAction,
} from "@/lib/actions/wheel";

export default function RouePage() {
  const [segments, setSegments] = useState<WheelSegment[]>(DEFAULT_WHEEL_SEGMENTS);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [todayReward, setTodayReward] = useState<number | undefined>(undefined);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const status = await getDailySpinStatusAction();
        setIsLoggedIn(status.isLoggedIn);
        setIsActivated(status.isActivated);
        setHasSpunToday(status.hasSpunToday);
        setTodayReward(status.todayReward);
        if (status.segments && Array.isArray(status.segments)) {
          setSegments(status.segments);
        }
      } catch (e) {
        console.error("Erreur statut roue:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  const handleSpin = async () => {
    if (isSpinning || hasSpunToday) return;

    setErrorMessage(null);
    setWinMessage(null);
    setIsSpinning(true);

    try {
      const res = await spinWheelAction();

      if (!res.success || res.winningIndex === undefined) {
        setIsSpinning(false);
        setErrorMessage(res.message || "Impossible de lancer la roue.");
        return;
      }

      // Calcul de la rotation pour s'arrêter sur le segment gagnant tiré par le serveur
      // La flèche est au sommet (12h, angle 0° relatif au haut)
      // Le segment i démarre à i*30° et son centre est à i*30 + 15°
      // Pour l'amener à 12h (0°), on tourne de 360 - (i*30 + 15)
      const winningIndex = res.winningIndex;
      const targetDegrees = 360 - (winningIndex * 30 + 15);
      const extraSpins = 360 * 6; // 6 tours complets pour l'effet spectaculaire
      const finalAngle = rotation + extraSpins + targetDegrees;

      setRotation(finalAngle);

      // Durée de la rotation : 4.5 secondes
      setTimeout(() => {
        setIsSpinning(false);
        setHasSpunToday(true);
        setTodayReward(res.amount || 56);
        setWinMessage(
          res.message || `Félicitations ! Vous avez gagné ${res.label || "XOF 56"} crédité sur votre solde de retrait.`
        );
      }, 4600);
    } catch (err) {
      console.error(err);
      setIsSpinning(false);
      setErrorMessage("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  };

  // Dimensions et géométrie SVG
  const size = 400;
  const center = size / 2;
  const radius = 175;

  return (
    <div className="min-h-screen bg-[#F4F7F0] dark:bg-[#0A120E] py-6 sm:py-10 px-3 sm:px-4 transition-colors">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation retour & Badge statut */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14500C] dark:text-[#A3E635] hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>1 Tour Offert</span>
          </div>
        </div>

        {/* Titre & Sous-titre officiels */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-[#14500C] dark:text-[#A3E635] text-[11px] font-black tracking-widest uppercase select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TOUR DE BIENVENUE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#14201A] dark:text-white tracking-tight">
            Tourne la roue de la chance
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6B60] dark:text-gray-300 max-w-md mx-auto leading-relaxed">
            Fais tourner la roue et réclame ta récompense créditée directement sur ton solde de retrait.
          </p>
        </div>

        {/* Alerte si le compte n'est pas activé */}
        {!loading && isLoggedIn && !isActivated && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                L'activation de votre compte est requise pour utiliser votre tour de bienvenue.
              </p>
            </div>
            <Link
              href="/activation"
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
            >
              Activer
            </Link>
          </div>
        )}

        {/* Grande carte à fond dégradé vert foncé avec halo violet discret */}
        <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#0F3D0A] via-[#14500C] to-[#1B4D0F] p-4 sm:p-7 shadow-2xl border border-emerald-900/40 text-center overflow-hidden">
          {/* Halo violet discret en arrière-plan */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Conteneur de la roue et de la flèche */}
          <div className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto aspect-square flex items-center justify-center my-2">
            {/* Flèche jaune dorée au sommet pointant vers le bas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 drop-shadow-md pointer-events-none">
              <svg width="44" height="42" viewBox="0 0 44 42" fill="none">
                <path
                  d="M22 40L6 4C5 2 6.5 0 8.5 0H35.5C37.5 0 39 2 38 4L22 40Z"
                  fill="#FACC15"
                  stroke="#B45309"
                  strokeWidth="2.5"
                />
                <path
                  d="M22 34L11 6H33L22 34Z"
                  fill="#FDE047"
                />
              </svg>
            </div>

            {/* Roue SVG interactive */}
            <svg
              className="w-full h-full select-none"
              viewBox={`0 0 ${size} ${size}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)"
                  : "none",
              }}
            >
              <defs>
                {/* Dégradé doré pour l'anneau extérieur */}
                <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="25%" stopColor="#FEF08A" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="75%" stopColor="#FEF9C3" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>

                {/* Dégradé doré pour le moyeu central */}
                <radialGradient id="centerHub" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#FEF08A" />
                  <stop offset="100%" stopColor="#EAB308" />
                </radialGradient>
              </defs>

              {/* 1. Les 12 segments colorés */}
              <g>
                {segments.map((seg, idx) => {
                  const startAngle = idx * 30;
                  const endAngle = (idx + 1) * 30;
                  const midAngle = startAngle + 15;

                  // Conversion en radians (0° aligné avec le haut / 12h)
                  const startRad = ((startAngle - 90) * Math.PI) / 180;
                  const endRad = ((endAngle - 90) * Math.PI) / 180;

                  const x1 = center + radius * Math.cos(startRad);
                  const y1 = center + radius * Math.sin(startRad);
                  const x2 = center + radius * Math.cos(endRad);
                  const y2 = center + radius * Math.sin(endRad);

                  return (
                    <g key={seg.index}>
                      {/* Secteur */}
                      <path
                        d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                        fill={seg.color}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      {/* Libellé du montant (XOF + Valeur) */}
                      <g transform={`rotate(${midAngle}, ${center}, ${center})`}>
                        <text
                          x={center}
                          y={center - radius * 0.76}
                          fill="#FFFFFF"
                          textAnchor="middle"
                          className="font-bold tracking-tight select-none"
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                          }}
                        >
                          XOF
                        </text>
                        <text
                          x={center}
                          y={center - radius * 0.62}
                          fill="#FFFFFF"
                          textAnchor="middle"
                          className="font-black select-none"
                          style={{
                            fontSize: "15px",
                            fontWeight: 900,
                            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                          }}
                        >
                          {seg.amount}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* 2. Anneau doré extérieur */}
              <circle
                cx={center}
                cy={center}
                r={radius + 8}
                fill="none"
                stroke="url(#goldRing)"
                strokeWidth="16"
              />

              {/* 3. Lumières dorées et blanches scintillantes tout autour de l'anneau */}
              {Array.from({ length: 24 }).map((_, lightIdx) => {
                const lightAngle = lightIdx * (360 / 24);
                const lightRad = ((lightAngle - 90) * Math.PI) / 180;
                const lx = center + (radius + 8) * Math.cos(lightRad);
                const ly = center + (radius + 8) * Math.sin(lightRad);
                const isBright = lightIdx % 2 === 0;

                return (
                  <circle
                    key={lightIdx}
                    cx={lx}
                    cy={ly}
                    r={isBright ? 3.8 : 2.8}
                    fill={isBright ? "#FFFFFF" : "#FEF08A"}
                    stroke="#B45309"
                    strokeWidth="0.8"
                    className={isBright ? "animate-pulse" : ""}
                  />
                );
              })}

              {/* 4. Centre blanc/doré avec relief 3D */}
              <circle
                cx={center}
                cy={center}
                r="36"
                fill="url(#goldRing)"
                stroke="#B45309"
                strokeWidth="2"
              />
              <circle
                cx={center}
                cy={center}
                r="30"
                fill="url(#centerHub)"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              <circle
                cx={center}
                cy={center}
                r="16"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Messages de résultat / erreur */}
          {winMessage && (
            <div className="mt-4 p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-emerald-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0" />
              <span>{winMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-2xl text-red-200 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Section bouton sous la roue */}
          <div className="mt-5 space-y-2">
            {!hasSpunToday ? (
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || (isLoggedIn && !isActivated)}
                className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-[#A3E635] hover:bg-[#bef264] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-[#14500C] font-black text-sm sm:text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    <span>TIRAGE EN COURS...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>TOURNER LA ROUE</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-white/15 text-white/50 font-black text-sm sm:text-base cursor-not-allowed border border-white/10"
                >
                  DÉJÀ UTILISÉ
                </button>
                <p className="text-xs text-white/80 font-medium">
                  Vous avez déjà utilisé votre tour de bienvenue.
                  {todayReward ? ` (Récompense : XOF ${todayReward})` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
