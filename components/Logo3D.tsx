"use client";

import { useState, useRef, MouseEvent } from "react";
import Image from "next/image";

interface Logo3DProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
}

export function Logo3D({ size = "md", className = "", showSubtitle = false }: Logo3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // Dimensions adaptées à l'emplacement (grande et lisible sur les pages d'authentification)
  const sizeClasses = {
    sm: {
      gap: "gap-2 sm:gap-2.5",
      iconClass: "h-7 sm:h-8 w-auto",
      textClass: "h-4 sm:h-5 w-auto",
      iconWidth: 45,
      iconHeight: 32,
      textWidth: 140,
      textHeight: 17,
    },
    md: {
      gap: "gap-3 sm:gap-3.5",
      iconClass: "h-11 sm:h-14 w-auto",
      textClass: "h-7 sm:h-9 w-auto",
      iconWidth: 80,
      iconHeight: 58,
      textWidth: 240,
      textHeight: 29,
    },
    lg: {
      gap: "gap-4 sm:gap-5",
      iconClass: "h-14 sm:h-16 w-auto",
      textClass: "h-9 sm:h-11 w-auto",
      iconWidth: 100,
      iconHeight: 72,
      textWidth: 300,
      textHeight: 36,
    },
  }[size];

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Halo de lueur ambiante vert doux d'arrière-plan */}
      <div
        className="absolute -inset-2 rounded-full opacity-25 blur-xl transition-all duration-500 pointer-events-none"
        style={{
          background: isHovered
            ? "radial-gradient(circle, rgba(143,207,8,0.35) 0%, rgba(17,66,2,0.15) 70%, transparent 100%)"
            : "radial-gradient(circle, rgba(143,207,8,0.2) 0%, rgba(17,66,2,0.08) 70%, transparent 100%)",
        }}
      />

      {/* Affichage direct sur la couleur de fond, sans carré ni cadre */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative z-10 cursor-pointer transition-transform duration-200 ease-out flex items-center justify-center ${sizeClasses.gap}`}
        style={{
          transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${
            isHovered ? 1.04 : 1
          }, ${isHovered ? 1.04 : 1}, 1)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* 1. Icône 'V' seul, transparent, sans carré ni cadre */}
        <div
          className="relative transition-transform duration-200"
          style={{ transform: "translateZ(15px)" }}
        >
          <Image
            src="/images/logo-icon.png"
            alt="Vita Earn"
            width={sizeClasses.iconWidth}
            height={sizeClasses.iconHeight}
            className={`${sizeClasses.iconClass} object-contain mix-blend-multiply drop-shadow-sm`}
            priority
          />
        </div>

        {/* 2. Nom 'VITA EARN' découpé avec police et couleurs originales */}
        <div
          className="relative transition-transform duration-200 flex items-center"
          style={{ transform: "translateZ(12px)" }}
        >
          <Image
            src="/images/logo-text.png"
            alt="Vita Earn"
            width={sizeClasses.textWidth}
            height={sizeClasses.textHeight}
            className={`${sizeClasses.textClass} object-contain mix-blend-multiply drop-shadow-sm`}
            priority
          />
        </div>
      </div>

      {showSubtitle && (
        <span className="mt-2 text-[10px] font-semibold text-vita-muted uppercase tracking-widest flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-vita-bright animate-pulse" />
          Plateforme Officielle
        </span>
      )}
    </div>
  );
}
