"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, Loader2, Phone } from "lucide-react";
import { updatePhoneAction } from "./actions";

interface ProfilePhoneEditorProps {
  initialPhone: string;
}

export function ProfilePhoneEditor({ initialPhone }: ProfilePhoneEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(initialPhone === "Non renseigné" ? "" : initialPhone);
  const [displayedPhone, setDisplayedPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!phone.trim()) {
      setError("Veuillez saisir un numéro de téléphone.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updatePhoneAction(phone.trim());
      if (res.success && res.phone) {
        setDisplayedPhone(res.phone);
        setIsEditing(false);
      } else {
        setError(res.error || "Impossible d'enregistrer le numéro.");
      }
    });
  };

  const handleCancel = () => {
    setPhone(displayedPhone === "Non renseigné" ? "" : displayedPhone);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          TÉLÉPHONE
        </p>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14500C] dark:text-[#A3E635] hover:underline cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            <span>{displayedPhone === "Non renseigné" ? "Ajouter" : "Modifier"}</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#2A3E31] bg-gray-50 dark:bg-[#0D1610] text-[#14201A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2F7A1A]"
                disabled={isPending}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#14500C] text-white text-xs font-bold hover:bg-[#2F7A1A] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Enregistrer</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-[#2A3E31] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
        </div>
      ) : (
        <p className="text-sm sm:text-base font-semibold text-[#14201A] dark:text-gray-100 mt-0.5 truncate">
          {displayedPhone}
        </p>
      )}
    </div>
  );
}
