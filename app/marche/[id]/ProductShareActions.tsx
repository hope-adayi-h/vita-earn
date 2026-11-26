"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ProductShareActionsProps {
  productId: string;
  compact?: boolean;
}

export function ProductShareActions({ productId, compact = false }: ProductShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/marche/${productId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title="Copier le lien de partage (Statut WhatsApp, etc.)"
        className={`touch-target px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
          copied
            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            <span>Copié</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lien</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`touch-target w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all inline-flex items-center justify-center gap-2 border cursor-pointer ${
        copied
          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
          : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Lien copié ! Collez-le sur votre statut WhatsApp</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copier le lien du produit (Statut WhatsApp)</span>
        </>
      )}
    </button>
  );
}
