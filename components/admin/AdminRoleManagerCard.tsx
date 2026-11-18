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
    <div className="bg-[#0B1322] border border-[#1A2840] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Gestion des Droits Administrateur
            </h3>
            <p className="text-[11px] text-slate-400">
              Contrôlé exclusivement par le Super Administrateur principal (Espoir)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-700/50">
          Privilèges Maître
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
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
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#131F33] border border-[#223555] text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isPending || !identifier.trim()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nommer Administrateur</span>
        </button>
      </form>

      {/* Liste des administrateurs actuels */}
      <div className="pt-2 border-t border-[#162338] space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Administrateurs Actifs ({currentAdmins.length})
        </span>

        <div className="space-y-1.5">
          {currentAdmins.map((adm) => {
            const isMaster = adm.email === "adayiespoir60@gmail.com";
            return (
              <div
                key={adm.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E1729] border border-[#1A2840] text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                    {(adm.name || adm.email || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-white">
                      {adm.name || adm.email || "Administrateur"}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      ({adm.email})
                    </span>
                  </div>
                </div>

                {isMaster ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
                    Fondateur
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevoke(adm.email)}
                    disabled={isPending}
                    className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
