import type { PremiumAppId } from "@/lib/data/premium-apps-store";

interface PremiumAppLogoProps {
  appId: PremiumAppId;
  className?: string;
}

export function PremiumAppLogo({ appId, className = "w-12 h-12" }: PremiumAppLogoProps) {
  switch (appId) {
    case "netflix":
      return (
        <div
          className={`${className} rounded-2xl bg-[#141414] border border-red-900/40 flex items-center justify-center shadow-sm shrink-0`}
          aria-label="Logo Netflix"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
            <path d="M6.5 3h3.2l4.6 12.6V3H17.5v18h-3.1L9.7 8.4V21H6.5V3z" fill="#E50914" />
            <path d="M6.5 3h3.2l4.6 18h-3.1L6.5 3z" fill="#B20710" />
          </svg>
        </div>
      );

    case "vita-canal-plus":
      return (
        <div
          className={`${className} rounded-2xl bg-black border border-slate-800 flex items-center justify-center shadow-sm shrink-0`}
          aria-label="Logo Vita Canal+"
        >
          <svg viewBox="0 0 36 24" className="w-8 h-6" fill="none">
            <rect x="1.5" y="3" width="33" height="18" rx="3" stroke="#FFFFFF" strokeWidth="1.5" />
            <text
              x="14"
              y="15.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7.5"
              fontWeight="900"
              fontFamily="Inter, system-ui, sans-serif"
              letterSpacing="0.5"
            >
              CANAL
            </text>
            <path d="M27.5 9v6M24.5 12h6" stroke="#7ED321" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      );

    case "gemini-pro":
      return (
        <div
          className={`${className} rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1E3A8A] border border-blue-400/30 flex items-center justify-center shadow-sm shrink-0`}
          aria-label="Logo Gemini Pro"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
            <defs>
              <linearGradient id="geminiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <path
              d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
              fill="url(#geminiGrad)"
            />
          </svg>
        </div>
      );

    case "telegram":
      return (
        <div
          className={`${className} rounded-2xl bg-[#229ED9] border border-sky-400/40 flex items-center justify-center shadow-sm shrink-0`}
          aria-label="Logo Telegram"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
            <path
              d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
  }
}
