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
    <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Gestion des Droits Administrateur
            </h3>
            <p className="text-[11px] text-slate-500">
              Contrôlé exclusivement par le Super Administrateur principal (Espoir)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          Privilèges Maître
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
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
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0084FF]"
        />
        <button
          type="submit"
          disabled={isPending || !identifier.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nommer Administrateur</span>
        </button>
      </form>

      {/* Liste des administrateurs actuels */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Administrateurs Actifs ({currentAdmins.length})
        </span>

        <div className="space-y-1.5">
          {currentAdmins.map((adm) => {
            const isMaster = adm.email === "adayiespoir60@gmail.com";
            return (
              <div
                key={adm.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0084FF] flex items-center justify-center font-bold text-[10px]">
                    {(adm.name || adm.email || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900">
                      {adm.name || adm.email || "Administrateur"}
                    </span>
                    <span className="text-slate-500 text-[11px] ml-2">
                      ({adm.email})
                    </span>
                  </div>
                </div>

                {isMaster ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Fondateur
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevoke(adm.email)}
                    disabled={isPending}
                    className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
