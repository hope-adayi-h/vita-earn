import Link from "next/link";
import { MessageSquare, Send, Users, ShieldCheck, ExternalLink, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Centre Communautaire — Vita Earn",
  description: "Rejoignez nos canaux officiels WhatsApp et Telegram Vita Earn.",
};

export default function CommunautePage() {
  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-vita-deep hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
            Communauté Officielle
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-vita-surface text-vita-deep flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-vita-deep">Centre Communautaire</h1>
              <p className="text-xs sm:text-sm text-vita-muted">
                Nos canaux de diffusion officiels WhatsApp & Telegram
              </p>
            </div>
          </div>

          <div className="p-4 bg-vita-surface rounded-2xl border border-vita-border/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-vita-medium shrink-0 mt-0.5" />
            <p className="text-xs text-vita-text leading-relaxed">
              Pour votre sécurité, utilisez exclusivement les liens listés ici. Aucun administrateur officiel Vita Earn ne vous demandera votre mot de passe ou code secret.
            </p>
          </div>

          <div className="space-y-4">
            {/* WhatsApp */}
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Chaîne WhatsApp Officielle</h2>
                  <p className="text-xs text-gray-600">Annonces, actualités de la plateforme & astuces</p>
                </div>
              </div>
              <a
                href="https://whatsapp.com/channel/0029Vaexample"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                <span>Rejoindre WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Telegram */}
            <div className="p-5 rounded-2xl border border-sky-200 bg-sky-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Canal Telegram Officiel</h2>
                  <p className="text-xs text-gray-600">Preuves de paiement, quiz & discussions VIP</p>
                </div>
              </div>
              <a
                href="https://t.me/vitaearn_officiel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                <span>Rejoindre Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
