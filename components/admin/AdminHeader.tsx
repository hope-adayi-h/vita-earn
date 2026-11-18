"use client";

import { useTransition } from "react";
import { Lock, ShieldCheck, LogOut, Clock } from "lucide-react";
import { lockAdminSessionAction } from "@/app/admin/actions";

interface AdminHeaderProps {
  userEmail: string;
  isSuperAdmin: boolean;
}

export function AdminHeader({ userEmail, isSuperAdmin }: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLock = () => {
    startTransition(async () => {
      await lockAdminSessionAction();
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#14500C] to-[#2F7A1A] flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-950/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
              Session Administrateur Active
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              {isSuperAdmin ? "Super Admin" : "Délégué"}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Connecté : <span className="font-semibold text-gray-700 dark:text-gray-300">{userEmail}</span> • Déverrouillage biométrique & code actif
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={handleLock}
          disabled={isPending}
          className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
          title="Verrouille instantanément la session d'administration"
        >
          <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>{isPending ? "Verrouillage..." : "Verrouiller l'accès"}</span>
        </button>
      </div>
    </div>
  );
}
