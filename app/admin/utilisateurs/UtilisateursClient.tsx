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
  Eye,
  PlayCircle,
  PauseCircle,
  Trash2,
  Key,
  RefreshCw,
  GitBranch,
  Wallet,
  CreditCard,
  History,
  X,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import {
  activateUserAction,
  deactivateUserAction,
  banOrDeleteUserAction,
  unbanUserAction,
  changeUserPasswordAction,
  changeUserUplineAction,
  manageAdminRoleAction,
} from "@/app/admin/actions";

export interface ReferralMember {
  id: string;
  name: string;
  email: string;
  isActivated: boolean;
  createdAt: string;
}

export interface UserWithdrawalItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

export interface UserTransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
}

export interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  isActivated: boolean;
  isBanned?: boolean;
  bannedReason?: string;
  referralCode?: string;
  upline?: string;
  balance?: number;
  points?: number;
  referralsCount?: number;
  referralsLevel1?: ReferralMember[];
  referralsLevel2?: ReferralMember[];
  referralsLevel3?: ReferralMember[];
  withdrawals?: UserWithdrawalItem[];
  transactions?: UserTransactionItem[];
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
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "activated" | "pending" | "admin">(initialFilter);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Formulaires dans le modal
  const [newPassword, setNewPassword] = useState("");
  const [newUpline, setNewUpline] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activatedUsersCount = users.filter((u) => u.isActivated && !u.isBanned).length;
  const pendingUsersCount = users.filter((u) => !u.isActivated && !u.isBanned).length;
  const adminUsersCount = users.filter((u) => u.role === "admin").length;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (filter === "activated") return u.isActivated && !u.isBanned;
    if (filter === "pending") return !u.isActivated && !u.isBanned;
    if (filter === "admin") return u.role === "admin";
    return true;
  });

  // 1. Activer manuellement un compte
  const handleActivate = (user: UserItem) => {
    setMessage(null);
    startTransition(async () => {
      const res = await activateUserAction({
        userId: user.id,
        identifier: user.email || user.username,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: res.message || "Compte activé avec succès." });
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActivated: true, isBanned: false } : u))
        );
        if (selectedUser?.id === user.id) {
          setSelectedUser((prev) => (prev ? { ...prev, isActivated: true, isBanned: false } : null));
        }
      }
    });
  };

  // 2. Désactiver manuellement un compte
  const handleDeactivate = (user: UserItem) => {
    setMessage(null);
    startTransition(async () => {
      const res = await deactivateUserAction({
        userId: user.id,
        identifier: user.email || user.username,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: res.message || "Compte désactivé." });
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActivated: false } : u))
        );
        if (selectedUser?.id === user.id) {
          setSelectedUser((prev) => (prev ? { ...prev, isActivated: false } : null));
        }
      }
    });
  };

  // 3. Supprimer / Bannir un utilisateur
  const handleBanOrDelete = (user: UserItem) => {
    const isMaster = user.email === "adayiespoir60@gmail.com";
    if (isMaster) {
      alert("Le compte Super Administrateur ne peut pas être supprimé.");
      return;
    }

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer / suspendre le compte de ${user.name} ?\n\nL'utilisateur sera bloqué et sera invité à contacter le support client à toute tentative de connexion.`
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      const res = await banOrDeleteUserAction({
        userId: user.id,
        identifier: user.email || user.username,
        reason: "Compte supprimé par l'administrateur.",
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: res.message || "Compte suspendu." });
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBanned: true, isActivated: false } : u))
        );
        if (selectedUser?.id === user.id) {
          setSelectedUser((prev) => (prev ? { ...prev, isBanned: true, isActivated: false } : null));
        }
      }
    });
  };

  // 4. Modifier le mot de passe dans le modal Détails
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      setModalMessage({ type: "error", text: "Le mot de passe doit comporter au moins 6 caractères." });
      return;
    }

    setModalMessage(null);
    startTransition(async () => {
      const res = await changeUserPasswordAction({
        userId: selectedUser.id,
        identifier: selectedUser.email || selectedUser.username,
        newPassword,
      });

      if (res.error) {
        setModalMessage({ type: "error", text: res.error });
      } else {
        setModalMessage({ type: "success", text: res.message || "Mot de passe modifié." });
        setNewPassword("");
      }
    });
  };

  // 5. Modifier le parrain dans le modal Détails
  const handleChangeUpline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newUpline.trim()) {
      setModalMessage({ type: "error", text: "Veuillez saisir un parrain valide." });
      return;
    }

    setModalMessage(null);
    startTransition(async () => {
      const res = await changeUserUplineAction({
        userId: selectedUser.id,
        identifier: selectedUser.email || selectedUser.username,
        newUplineIdentifier: newUpline,
      });

      if (res.error) {
        setModalMessage({ type: "error", text: res.error });
      } else {
        setModalMessage({ type: "success", text: res.message || "Parrain modifié avec succès." });
        const updatedUpline = res.newUpline || newUpline;
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, upline: updatedUpline } : u))
        );
        setSelectedUser((prev) => (prev ? { ...prev, upline: updatedUpline } : null));
        setNewUpline("");
      }
    });
  };

  // 6. Gestion du rôle admin
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
        if (selectedUser?.id === user.id) {
          setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
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
            {users.length} compte(s) enregistré(s) • Contrôle des statuts d&apos;activation, parrainages et accès
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

      {/* Message de notification global */}
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

      {/* ========================================================================= */}
      {/* LISTE DES CARTES UTILISATEURS (CONFORME À LA CAPTURE D'ÉCRAN FOURNIE)     */}
      {/* ========================================================================= */}
      <div className="space-y-3.5">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-100">
            Aucun utilisateur ne correspond à votre recherche.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isMaster = u.email === "adayiespoir60@gmail.com";
            const initials = (u.username || u.name || "U").slice(0, 2).toUpperCase();

            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-[#0084FF]/40 transition-all space-y-4"
              >
                {/* 1. LIGNE DU HAUT : AVATAR, IDENTITÉS, BADGE STATUT, CONTACT */}
                <div className="flex items-start gap-3.5">
                  {/* Avatar rond avec initiales en bleu ciel */}
                  <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-black text-sm shrink-0 border border-sky-200/70">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Nom + Badge statut */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-base">
                        {u.username || u.name}
                      </span>

                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Supprimé / Banni
                        </span>
                      ) : u.isActivated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Activé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563] border border-slate-200/60">
                          <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                          Inactif
                        </span>
                      )}

                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          <Shield className="w-3 h-3" />
                          {isMaster ? "Super Admin" : "Admin"}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="text-xs sm:text-sm text-slate-600 font-medium truncate">
                      {u.email}
                    </div>

                    {/* Téléphone, Pays, Date */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5 flex-wrap">
                      {u.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phone}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.country || "TG"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. LIGNE DU MILIEU : SOLDE (SANS POINT AU MILIEU), POINTS, FILLEULS */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      SOLDE
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#0284C7] mt-0.5">
                      XOF {(u.balance || 0).toLocaleString("fr-FR")}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      POINTS
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {u.points || 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      FILLEULS
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {u.referralsCount || 0}
                    </div>
                  </div>
                </div>

                {/* 3. LIGNE DU BAS : LES 3 BOUTONS D'ACTION (DÉTAILS, ACTIVER/DÉSACTIVER, SUPPRIMER) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                  {/* Bouton 1 : DÉTAILS */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setModalMessage(null);
                    }}
                    className="px-2.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Eye className="w-4 h-4 text-slate-700 shrink-0" />
                    <span>Détails</span>
                  </button>

                  {/* Bouton 2 : ACTIVER OU DÉSACTIVER */}
                  {!u.isActivated || u.isBanned ? (
                    <button
                      type="button"
                      onClick={() => handleActivate(u)}
                      disabled={isPending}
                      className="px-2.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <PlayCircle className="w-4 h-4 shrink-0" />
                      <span>Activer</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(u)}
                      disabled={isPending}
                      className="px-2.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <PauseCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Désactiver</span>
                    </button>
                  )}

                  {/* Bouton 3 : SUPPRIMER */}
                  <button
                    type="button"
                    onClick={() => handleBanOrDelete(u)}
                    disabled={isPending || isMaster}
                    className="px-2.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-[#FFFBEB] hover:bg-amber-100/80 text-[#92400E] border border-[#FCD34D] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-[#92400E] shrink-0" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL COMPLET « DÉTAILS DE L'UTILISATEUR »                                */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-6 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            {/* En-tête Modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-black text-sm shrink-0 border border-sky-200/70">
                  {(selectedUser.username || selectedUser.name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      {selectedUser.username || selectedUser.name}
                    </h2>
                    {selectedUser.isBanned ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        Banni / Supprimé
                      </span>
                    ) : selectedUser.isActivated ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Compte Activé
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        En Attente d&apos;Activation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message de notification interne au modal */}
            {modalMessage && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                  modalMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {modalMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{modalMessage.text}</span>
              </div>
            )}

            {/* 1. Coordonnées et Identité */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-xs sm:text-sm">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                Informations du Compte
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block text-xs">Nom d&apos;utilisateur :</span>
                  <span className="font-bold text-slate-900">@{selectedUser.username}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Email officiel :</span>
                  <span className="font-bold text-slate-900">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Numéro WhatsApp / Téléphone :</span>
                  <span className="font-bold text-slate-900">{selectedUser.phone || "Non renseigné"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Pays :</span>
                  <span className="font-bold text-slate-900">{selectedUser.country || "Togo"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Code Parrainage Personnel :</span>
                  <span className="font-mono font-bold text-[#0084FF]">{selectedUser.referralCode || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Date d&apos;inscription :</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Parrain Actuel & Possibilité de Changer de Parrain */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Parrain Actuel
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900">
                    <GitBranch className="w-4 h-4 text-[#0084FF]" />
                    <span>{selectedUser.upline || "Aucun (Racine)"}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Lignée d&apos;affiliation</span>
              </div>

              {/* Formulaire pour modifier le parrain */}
              <form onSubmit={handleChangeUpline} className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Changer le parrain de cet utilisateur :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUpline}
                    onChange={(e) => setNewUpline(e.target.value)}
                    placeholder="Email, username ou code du nouveau parrain..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0084FF]"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Modifier le parrain
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  L&apos;administrateur peut réassigner le parrain si le filleul s&apos;est trompé de lien lors de son inscription.
                </p>
              </form>
            </div>

            {/* 3. Solde & Trésorerie */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Solde Actuel Disponible
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {formatFCFA(selectedUser.balance || 0)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Commissions Cumulées
                </span>
                <div className="text-2xl font-black text-[#0084FF] mt-1">
                  {formatFCFA(selectedUser.points || 0)}
                </div>
              </div>
            </div>

            {/* 4. Ses Filleuls par Niveau (Niveau 1, 2, 3) */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center justify-between">
                <span>Réseau de Filleuls (Programme 3 Niveaux)</span>
                <span className="text-xs text-slate-500 font-normal">
                  Total : {selectedUser.referralsCount || 0} membre(s)
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Niveau 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-500 uppercase">Niveau 1 (Directs)</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedUser.referralsLevel1?.length || 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                    2 000 FCFA par activation
                  </div>
                </div>

                {/* Niveau 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-500 uppercase">Niveau 2 (Second)</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedUser.referralsLevel2?.length || 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                    1 000 FCFA par activation
                  </div>
                </div>

                {/* Niveau 3 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-500 uppercase">Niveau 3 (Troisième)</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedUser.referralsLevel3?.length || 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                    500 FCFA par activation
                  </div>
                </div>
              </div>

              {/* Détail des filleuls niveau 1 si présents */}
              {selectedUser.referralsLevel1 && selectedUser.referralsLevel1.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 max-h-40 overflow-y-auto space-y-1.5">
                  <div className="text-xs font-bold text-slate-700">Détail des filleuls directs (Niveau 1) :</div>
                  {selectedUser.referralsLevel1.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 last:border-none">
                      <span className="font-bold text-slate-800">{ref.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ref.isActivated ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {ref.isActivated ? "Activé" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Historique de ses retraits */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm">
                Historique des Retraits Mobile Money
              </h3>
              {selectedUser.withdrawals && selectedUser.withdrawals.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {selectedUser.withdrawals.map((w) => (
                    <div key={w.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{formatFCFA(w.amount)}</span>
                        <span className="text-slate-400 ml-2 font-mono">({w.method.toUpperCase()})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === "paid" || w.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : w.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {w.status === "paid" ? "Payé" : w.status === "approved" ? "Approuvé" : "En attente"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-500 text-center">
                  Aucune demande de retrait enregistrée pour cet utilisateur.
                </div>
              )}
            </div>

            {/* 6. Historique des transactions */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm">
                Historique des Transactions du Compte
              </h3>
              {selectedUser.transactions && selectedUser.transactions.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {selectedUser.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{tx.type}</div>
                        <div className="text-[11px] text-slate-500">{tx.description}</div>
                      </div>
                      <span className="font-black text-emerald-600">
                        +{formatFCFA(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 text-xs text-slate-500 text-center">
                  Aucune écriture comptable sur ce compte pour l&apos;instant.
                </div>
              )}
            </div>

            {/* 7. Actions Administrateur : Modifier mot de passe & Statut */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                Actions Administrateur
              </h3>

              {/* Modifier le mot de passe */}
              <form onSubmit={handleChangePassword} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Définir un nouveau mot de passe :
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe (min. 6 caractères)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0084FF]"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-black text-white text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Changer mot de passe
                  </button>
                </div>
              </form>

              {/* Boutons d'activation, désactivation, suppression */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                {!selectedUser.isActivated || selectedUser.isBanned ? (
                  <button
                    type="button"
                    onClick={() => handleActivate(selectedUser)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Activer le compte
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(selectedUser)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Désactiver le compte
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleBanOrDelete(selectedUser)}
                  disabled={isPending || selectedUser.email === "adayiespoir60@gmail.com"}
                  className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Supprimer / Bannir le compte
                </button>

                {isSuperAdmin && selectedUser.email !== "adayiespoir60@gmail.com" && (
                  <button
                    type="button"
                    onClick={() => handleToggleRole(selectedUser)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ml-auto"
                  >
                    {selectedUser.role === "admin" ? "Révoquer Privilège Admin" : "Nommer Administrateur"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
