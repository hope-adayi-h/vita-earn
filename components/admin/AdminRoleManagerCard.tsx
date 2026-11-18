"use client";

import { useState, useTransition } from "react";
import { UserCheck, UserX, Shield, AlertCircle, CheckCircle2, UserPlus, Users } from "lucide-react";
import { manageAdminRoleAction } from "@/app/admin/actions";

interface AdminRoleManagerCardProps {
  currentAdmins: Array<{ id: string; email: string; name: string }>;
  isSuperAdmin: boolean;
}

export function AdminRoleManagerCard({
  currentAdmins,
  isSuperAdmin,
}: AdminRoleManagerCardProps) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isSuperAdmin) {
    return null; // Visible uniquement pour Espoir (Super Admin)
  }

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await manageAdminRoleAction({
        identifier: identifier.trim(),
        newRole: "admin",
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.message || "Administrateur ajouté avec succès.");
        setIdentifier("");
      }
    });
  };

  const handleRevoke = (targetEmail: string) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await manageAdminRoleAction({
        identifier: targetEmail,
        newRole: "user",
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.message || "Droits administrateur révoqués.");
      }
    });
  };

  return (
    <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Gestion des Droits Administrateur
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Contrôlé exclusivement par le Super Administrateur principal (Espoir)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          Privilèges Maître
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Formulaire d'ajout d'administrateur */}
      <form onSubmit={handleGrant} className="flex flex-col sm:flex-row gap-2 pt-1">
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email ou nom d'utilisateur du compte à promouvoir..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/20 border border-gray-200 dark:border-emerald-900/40 text-xs text-gray-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isPending || !identifier.trim()}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nommer Administrateur</span>
        </button>
      </form>

      {/* Liste des administrateurs actuels */}
      <div className="pt-2 border-t border-gray-100 dark:border-[#1E2E24] space-y-2">
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Administrateurs Actifs ({currentAdmins.length})
        </span>

        <div className="space-y-1.5">
          {currentAdmins.map((adm) => {
            const isMaster = adm.email === "adayiespoir60@gmail.com";
            return (
              <div
                key={adm.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-emerald-950/15 border border-gray-100 dark:border-emerald-900/20 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    {(adm.name || adm.email || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {adm.name || adm.email || "Administrateur"}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-[11px] ml-2">
                      ({adm.email})
                    </span>
                  </div>
                </div>

                {isMaster ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Fondateur
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevoke(adm.email)}
                    disabled={isPending}
                    className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <UserX className="w-3 h-3" />
                    <span>Révoquer</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
