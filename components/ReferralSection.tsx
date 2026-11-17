"use client";

import { useState } from "react";
import { Gift, Link2, Copy, Check } from "lucide-react";

interface ReferralMember {
  id: string;
  name: string;
  date: string;
  level: number;
  isActivated: boolean;
}

interface ReferralSectionProps {
  referralCode: string;
  appUrl: string;
  level1Count?: number;
  level2Count?: number;
  level3Count?: number;
  level1Earned?: number;
  level2Earned?: number;
  level3Earned?: number;
  referrals?: ReferralMember[];
}

export function ReferralSection({
  referralCode,
  appUrl,
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `${appUrl}/auth/register?ref=${referralCode || "VE"}`;
  const shareMessage = `Rejoins-moi sur Vita Earn : ${referralLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback si l'API presse-papiers est indisponible
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;

  return (
    <div id="equipe" className="w-full">
      <div className="rounded-3xl sm:rounded-[32px] bg-gradient-to-br from-[#0F3D0A] via-[#2F7A1A] to-[#84CC16] text-white p-5 sm:p-7 shadow-xl space-y-5 transition-all relative overflow-hidden">
        {/* Halo discret en arrière-plan */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Petit badge en haut à gauche : icône cadeau + "INVITER" avec contour blanc arrondi */}
        <div className="flex items-center justify-start relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-white/80 text-[11px] font-black tracking-widest text-white uppercase backdrop-blur-xs select-none">
            <Gift className="w-3.5 h-3.5 text-white" />
            <span>INVITER</span>
          </div>
        </div>

        {/* Titre en gros et en gras + Sous-titre */}
        <div className="space-y-1.5 text-left relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Inviter des amis
          </h2>
          <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-lg">
            Partagez votre lien pour faire découvrir Vita Earn à vos amis.
          </p>
        </div>

        {/* Champ blanc arrondi contenant l'icône de lien, le lien d'invitation et le bouton Copier */}
        <div className="bg-white rounded-2xl p-1.5 sm:p-2 pl-3.5 sm:pl-4 flex items-center justify-between gap-2 shadow-md relative z-10">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F7A1A] shrink-0" />
            <span
              className="truncate text-xs sm:text-sm font-semibold text-gray-700 select-all"
              title={referralLink}
            >
              {referralLink}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="bg-[#A3E635] hover:bg-[#bef264] active:scale-95 text-[#14500C] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shrink-0 shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#14500C]" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#14500C]" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Titre centré "PARTAGER VIA" + Les 3 boutons blancs arrondis côte à côte */}
        <div className="pt-1 space-y-3 relative z-10">
          <p className="text-center text-xs font-black tracking-widest text-white/95 uppercase select-none">
            PARTAGER VIA
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 active:scale-95 text-gray-900 rounded-2xl py-2.5 sm:py-3 px-2 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all font-bold text-xs sm:text-sm no-underline"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                viewBox="0 0 24 24"
                fill="#25D366"
              >
                <path d="M12.031 0C5.396 0 0 5.396 0 12.031c0 2.119.554 4.188 1.609 6.008L.062 24l6.156-1.594c1.758.961 3.75 1.469 5.813 1.469 6.633 0 12.031-5.396 12.031-12.031S18.664 0 12.031 0zm0 21.938c-1.844 0-3.648-.484-5.234-1.422l-.375-.219-3.891 1.016 1.047-3.797-.242-.391C2.359 15.484 1.875 13.781 1.875 12.03 1.875 6.438 6.438 1.875 12.031 1.875c5.594 0 10.156 4.563 10.156 10.156 0 5.594-4.562 10.157-10.156 10.157zm5.563-7.609c-.305-.156-1.805-.891-2.086-.992-.281-.102-.484-.156-.688.156-.203.312-.789.992-.969 1.195-.18.203-.359.227-.664.07-.305-.156-1.289-.477-2.453-1.516-.906-.812-1.523-1.812-1.703-2.117-.18-.305-.02-.469.133-.625.14-.141.305-.359.453-.539.156-.18.203-.305.305-.508.102-.203.055-.383-.023-.539-.078-.156-.688-1.656-.945-2.273-.25-.602-.508-.523-.688-.531-.18-.008-.383-.008-.586-.008-.203 0-.539.078-.82.383-.281.305-1.078 1.055-1.078 2.57 0 1.516 1.102 2.977 1.258 3.18.156.203 2.164 3.305 5.242 4.633.734.312 1.305.5 1.75.641.734.234 1.406.203 1.938.125.594-.086 1.805-.738 2.063-1.453.258-.711.258-1.32.18-1.453-.078-.133-.281-.211-.586-.367z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* X (Twitter) */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 active:scale-95 text-gray-900 rounded-2xl py-2.5 sm:py-3 px-2 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all font-bold text-xs sm:text-sm no-underline"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="#000000"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X</span>
            </a>

            {/* Facebook */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-gray-50 active:scale-95 text-gray-900 rounded-2xl py-2.5 sm:py-3 px-2 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all font-bold text-xs sm:text-sm no-underline"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                viewBox="0 0 24 24"
                fill="#1877F2"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
