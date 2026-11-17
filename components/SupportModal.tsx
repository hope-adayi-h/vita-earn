"use client";

import { useState, useEffect } from "react";
import {
  Headphones,
  X,
  Mail,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getSupportSettingsAction, sendSupportMessageAction, SupportSettings } from "@/lib/actions/support";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

export function SupportModal({ isOpen, onClose, userEmail, userName }: SupportModalProps) {
  const [settings, setSettings] = useState<SupportSettings>({
    email: "support@vitaearn.com",
    telegram: "https://t.me/vitaearn_officiel",
    telegramUsername: "@vitaearn_officiel",
  });
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Formulaire d'envoi direct
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState(userEmail || "");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getSupportSettingsAction().then((s) => {
        if (s) setSettings(s);
      });
      if (userName && !name) setName(userName);
      if (userEmail && !email) setEmail(userEmail);
      setFeedback(null);
    }
  }, [isOpen, userName, userEmail]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    if (!settings.email) return;
    navigator.clipboard.writeText(settings.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setFeedback(null);

    const res = await sendSupportMessageAction({
      name: name.trim() || "Utilisateur Vita Earn",
      email: email.trim() || "utilisateur@vitaearn.com",
      message: message.trim(),
    });

    setIsSending(false);
    setFeedback(res);
    if (res.success) {
      setMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Fond obscurci */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Boîte modale */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#131E17] rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col border border-gray-100 dark:border-[#1E2E24] animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1B4D0F] to-[#2F7A1A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Support Client & Assistance
              </h2>
              <p className="text-xs text-emerald-100/80">
                Notre équipe est disponible 7j/7 pour vous accompagner
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fermer le support"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Canaux officiels directs */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2.5">
              Canaux Officiels Directs
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Canal Email */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#17241C] border border-gray-200/80 dark:border-[#1E2E24] flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Email de Support
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate block">
                      {settings.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${settings.email}?subject=Assistance%20Vita%20Earn`}
                    className="flex-1 text-center py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    Écrire
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1.5 rounded-xl bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Copier l'adresse email"
                  >
                    {copiedEmail ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Canal Telegram */}
              <div className="p-3.5 rounded-2xl bg-[#0088CC]/5 dark:bg-[#0088CC]/10 border border-[#0088CC]/30 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0088CC] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Send className="w-4 h-4 translate-x-[-1px] translate-y-[-1px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#0088CC] uppercase tracking-wider block">
                      Support Telegram
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate block">
                      {settings.telegramUsername || "Canal Officiel"}
                    </span>
                  </div>
                </div>

                <a
                  href={settings.telegram.startsWith("http") ? settings.telegram : `https://${settings.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-1.5 px-2 rounded-xl bg-[#0088CC] hover:bg-[#0077B5] text-white text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span>Rejoindre sur Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Formulaire d'envoi de message direct */}
          <div className="pt-2 border-t border-gray-100 dark:border-[#1E2E24]">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Laisser un message direct à l&apos;administrateur
              </p>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold mb-3 flex items-start gap-2.5 ${
                  feedback.success
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Votre Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom ou pseudo"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] rounded-xl text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Votre Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] rounded-xl text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Votre Message
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre question, un problème de transaction ou une suggestion..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#17241C] border border-gray-200 dark:border-[#1E2E24] rounded-xl text-gray-900 dark:text-gray-100 focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isSending ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer le message au support</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Pied */}
        <div className="p-3 bg-gray-50 dark:bg-[#0E1812] border-t border-gray-100 dark:border-[#1E2E24] flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Réponse garantie sous 24h
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
