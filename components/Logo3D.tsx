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
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // Dimensions réduites, élégantes et bien proportionnées
  const dimensions = {
    sm: { width: 100, height: 32, container: "py-1 px-3 max-w-[125px] rounded-xl" },
    md: { width: 130, height: 42, container: "py-2 px-4 max-w-[160px] rounded-2xl" },
    lg: { width: 165, height: 52, container: "py-2.5 px-5 max-w-[195px] rounded-2xl" },
  }[size];

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Halo de lueur ambiante vert doux */}
      <div
        className="absolute -inset-1 rounded-2xl opacity-30 blur-lg transition-all duration-500 pointer-events-none"
        style={{
          background: isHovered
            ? "radial-gradient(circle, rgba(126,211,33,0.35) 0%, rgba(27,77,15,0.15) 70%, transparent 100%)"
            : "radial-gradient(circle, rgba(126,211,33,0.2) 0%, rgba(27,77,15,0.08) 70%, transparent 100%)",
        }}
      />

      {/* Conteneur 3D flottant avec perspective */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative z-10 bg-white/95 border border-vita-border/90 shadow-md cursor-pointer transition-transform duration-200 ease-out flex items-center justify-center overflow-hidden animate-float-3d ${dimensions.container}`}
        style={{
          transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${
            isHovered ? 1.03 : 1
          }, ${isHovered ? 1.03 : 1}, 1)`,
          transformStyle: "preserve-3d",
          boxShadow: isHovered
            ? "0 12px 24px -6px rgba(27, 77, 15, 0.2), 0 0 12px 1px rgba(126, 211, 33, 0.25)"
            : "0 6px 16px -4px rgba(27, 77, 15, 0.1), 0 0 8px 1px rgba(126, 211, 33, 0.08)",
        }}
      >
        {/* Effet reflet de verre (glare 3D) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.3 : 0.08,
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.9) 0%, rgba(126,211,33,0.15) 45%, transparent 70%)`,
          }}
        />

        {/* Image du logo officiel Vita Earn */}
        <div
          className="relative transition-transform duration-300"
          style={{
            transform: "translateZ(20px)",
          }}
        >
          <Image
            src="/images/logo.png"
            alt="Vita Earn"
            width={dimensions.width}
            height={dimensions.height}
            className="w-auto h-auto max-h-9 object-contain filter drop-shadow-sm"
            priority
          />
        </div>
      </div>

      {showSubtitle && (
        <span className="mt-1.5 text-[10px] font-semibold text-vita-muted uppercase tracking-widest flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-vita-bright animate-pulse" />
          Plateforme Officielle
        </span>
      )}
    </div>
  );
}
