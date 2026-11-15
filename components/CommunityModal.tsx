"use client";

import { X, MessageSquare, ExternalLink, Send, Users, ShieldCheck } from "lucide-react";

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityModal({ isOpen, onClose }: CommunityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fond obscurci */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Boîte modale */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête vert */}
        <div className="p-4 sm:p-5 bg-vita-deep text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Centre Communautaire</h2>
              <p className="text-xs text-white/80">Canaux officiels WhatsApp & Telegram</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="p-3.5 bg-vita-surface rounded-xl border border-vita-border/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-vita-medium shrink-0 mt-0.5" />
            <p className="text-xs text-vita-text leading-relaxed">
              Rejoignez nos canaux officiels pour suivre les annonces importantes, les preuves de retrait en direct, les sessions de formation et les tutoriels de gains.
            </p>
          </div>

          <div className="space-y-3">
            {/* 1. Chaîne WhatsApp */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Chaîne WhatsApp Officielle</h3>
                    <p className="text-[11px] text-gray-600">Actualités, plannings & alertes gains</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Officiel
                </span>
              </div>
              <a
                href="https://whatsapp.com/channel/0029Vaexample"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Rejoindre la Chaîne WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 2. Canal Telegram */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Canal Telegram Officiel</h3>
                    <p className="text-[11px] text-gray-600">Preuves de retrait, quiz & conseils</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  Actif 24/7
                </span>
              </div>
              <a
                href="https://t.me/vitaearn_officiel"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Rejoindre le Canal Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 3. Groupe d'entraide */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-vita-deep" />
                <div>
                  <div className="text-xs font-bold text-gray-800">Groupe d'Entraide Membres</div>
                  <div className="text-[10px] text-gray-500">Posez vos questions aux leaders</div>
                </div>
              </div>
              <a
                href="https://chat.whatsapp.com/example"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-vita-deep hover:underline inline-flex items-center gap-1"
              >
                <span>Accéder</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Pied */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
