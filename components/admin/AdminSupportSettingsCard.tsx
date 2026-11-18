"use client";

import { useState } from "react";
import { Headphones, Mail, Send, CheckCircle2, Save, Sparkles } from "lucide-react";
import { updateSupportSettingsAction, SupportSettings } from "@/lib/actions/support";

interface AdminSupportSettingsCardProps {
  initialSettings: SupportSettings;
}

export function AdminSupportSettingsCard({ initialSettings }: AdminSupportSettingsCardProps) {
  const [email, setEmail] = useState(initialSettings.email || "support@vitaearn.com");
  const [telegram, setTelegram] = useState(initialSettings.telegram || "https://t.me/vitaearn_officiel");
  const [telegramUsername, setTelegramUsername] = useState(
    initialSettings.telegramUsername || "@vitaearn_officiel"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await updateSupportSettingsAction({
      email,
      telegram,
      telegramUsername,
    });

    setIsSaving(false);
    setFeedback(res);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 text-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-[#0084FF] flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Configuration du Support Client
            </h2>
            <p className="text-xs text-slate-500">
              Coordonnées visibles par tous les membres dans leur menu Support
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0084FF] border border-blue-200">
          <Sparkles className="w-3 h-3" />
          Synchronisation Directe
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            feedback.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email de support */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#0084FF]" />
              <span>Email officiel du Support</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: support@vitaearn.com"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0084FF] font-medium"
            />
          </div>

          {/* Pseudo Telegram */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-500" />
              <span>Nom d&apos;utilisateur ou Canal Telegram</span>
            </label>
            <input
              type="text"
              required
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              placeholder="ex: @VitaEarnSupport"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0084FF] font-medium"
            />
          </div>
        </div>

        {/* Lien direct Telegram */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-cyan-500" />
            <span>Lien direct Telegram (URL)</span>
          </label>
          <input
            type="text"
            required
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="ex: https://t.me/vitaearn_officiel"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0084FF] font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center gap-2 shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Enregistrement..." : "Enregistrer les coordonnées de support"}</span>
        </button>
      </form>
    </div>
  );
}
