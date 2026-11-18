"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { manageAdminRoleAction } from "@/app/admin/actions";

export interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  isActivated: boolean;
  referralCode?: string;
  createdAt: string;
}

interface UtilisateursClientProps {
  initialUsers: UserItem[];
  isSuperAdmin: boolean;
  currentUserEmail: string;
  initialFilter?: "all" | "activated" | "pending" | "admin";
}

export function UtilisateursClient({
  initialUsers,
  isSuperAdmin,
  currentUserEmail,
  initialFilter = "all",
}: UtilisateursClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "activated" | "pending" | "admin">(initialFilter);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activatedUsersCount = users.filter((u) => u.isActivated).length;
  const pendingUsersCount = users.filter((u) => !u.isActivated).length;
  const adminUsersCount = users.filter((u) => u.role === "admin").length;

  const filteredUsers = users.filter((u) => {
    // Filtre texte
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(q));

    // Filtre statut
    if (!matchSearch) return false;
    if (filter === "activated") return u.isActivated;
    if (filter === "pending") return !u.isActivated;
    if (filter === "admin") return u.role === "admin";
    return true;
  });

  const handleToggleRole = (user: UserItem) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setMessage(null);

    startTransition(async () => {
      const res = await manageAdminRoleAction({
        identifier: user.email,
        newRole,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: res.message || "Rôle mis à jour." });
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Retour et En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0084FF] hover:underline mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au tableau de bord</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">
            Gestion des Utilisateurs & Comptes
          </h1>
          <p className="text-xs text-slate-500">
            {users.length} compte(s) enregistré(s) • Contrôle des statuts d&apos;activation et des rôles
          </p>
        </div>
      </div>

      {/* 2 Cartes de Synthèse Directe : Activés vs En Attente d'Activation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => setFilter("activated")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filter === "activated"
              ? "bg-blue-50 border-[#0084FF] shadow-xs"
              : "bg-white border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0084FF] flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Comptes Activés</div>
                <div className="text-[11px] text-slate-500">Abonnement payé et validé</div>
              </div>
            </div>
            <div className="text-2xl font-black text-[#0084FF]">
              {activatedUsersCount}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filter === "pending"
              ? "bg-amber-50 border-amber-500 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">En Attente d&apos;Activation</div>
                <div className="text-[11px] text-slate-500">Inscrits n&apos;ayant pas encore activé</div>
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">
              {pendingUsersCount}
            </div>
          </div>
        </button>
      </div>

      {/* Message de notification */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Barre de recherche et filtres rapides */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0084FF] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === "all"
                ? "bg-[#0084FF] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tous ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("activated")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === "activated"
                ? "bg-[#0084FF] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Activés ({activatedUsersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            En attente ({pendingUsersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("admin")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === "admin"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Admins ({adminUsersCount})
          </button>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Aucun utilisateur ne correspond à votre recherche.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1E2E24]">
            {filteredUsers.map((u) => {
              const isMaster = u.email === "adayiespoir60@gmail.com";
              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-emerald-950/10 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#14500C] to-[#2F7A1A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">
                          {u.name}
                        </span>
                        <span className="text-xs text-gray-400">@{u.username}</span>

                        {u.role === "admin" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            <Shield className="w-3 h-3" />
                            {isMaster ? "Super Admin" : "Admin"}
                          </span>
                        )}

                        {u.isActivated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Activé (4 500 F)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            En attente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {u.phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {u.country || "Togo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions d'administration */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isSuperAdmin && !isMaster && (
                      <button
                        type="button"
                        onClick={() => handleToggleRole(u)}
                        disabled={isPending}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                          u.role === "admin"
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                            : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Révoquer Admin</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Nommer Admin</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
