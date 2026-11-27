"use client";

import { useState, useTransition } from "react";
import {
  Video,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Phone,
  ExternalLink,
  Trash2,
  Play,
  Square,
  Sparkles,
  Info,
} from "lucide-react";
import type { LiveConference, LiveStatus } from "@/lib/data/live-store";
import {
  reviewLiveAction,
  quickToggleLiveStatusAction,
  deleteLiveAction,
} from "./actions";

interface AdminLiveClientProps {
  initialLives: LiveConference[];
}

export function AdminLiveClient({ initialLives }: AdminLiveClientProps) {
  const [lives, setLives] = useState<LiveConference[]>(initialLives);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "live" | "rejected">("all");
  const [editingLive, setEditingLive] = useState<LiveConference | null>(null);
  const [rejectingLive, setRejectingLive] = useState<LiveConference | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Stats
  const pendingCount = lives.filter((l) => l.status === "pending").length;
  const approvedCount = lives.filter((l) => l.status === "approved").length;
  const liveCount = lives.filter((l) => l.status === "live").length;
  const rejectedCount = lives.filter((l) => l.status === "rejected").length;

  const filteredLives = lives.filter((l) => {
    if (filter === "all") return true;
    return l.status === filter;
  });

  // Disponibilités / conflits de date
  const checkDateConflict = (live: LiveConference) => {
    return lives.filter(
      (other) =>
        other.id !== live.id &&
        (other.status === "approved" || other.status === "live") &&
        other.scheduledDate === live.scheduledDate
    );
  };

  const handleQuickStatus = (liveId: string, status: LiveStatus) => {
    startTransition(async () => {
      const res = await quickToggleLiveStatusAction(liveId, status);
      if (res.ok) {
        setLives((prev) =>
          prev.map((item) => (item.id === liveId ? { ...item, status } : item))
        );
        setMessage({
          text: `Statut mis à jour : ${status.toUpperCase()}`,
          type: "success",
        });
      } else {
        setMessage({ text: res.error || "Erreur de mise à jour", type: "error" });
      }
    });
  };

  const handleDelete = (liveId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement cette conférence ?")) return;
    startTransition(async () => {
      const res = await deleteLiveAction(liveId);
      if (res.ok) {
        setLives((prev) => prev.filter((item) => item.id !== liveId));
        setMessage({ text: "Conférence supprimée avec succès.", type: "success" });
      } else {
        setMessage({ text: res.error || "Erreur lors de la suppression.", type: "error" });
      }
    });
  };

  const handleApproveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLive) return;

    const formData = new FormData(e.currentTarget);
    formData.set("liveId", editingLive.id);
    formData.set("status", "approved");

    startTransition(async () => {
      const res = await reviewLiveAction(null, formData);
      if (res.ok) {
        setLives((prev) =>
          prev.map((item) =>
            item.id === editingLive.id
              ? {
                  ...item,
                  status: "approved",
                  meetUrl: (formData.get("meetUrl") as string) || item.meetUrl,
                  scheduledDate: (formData.get("scheduledDate") as string) || item.scheduledDate,
                  scheduledTime: (formData.get("scheduledTime") as string) || item.scheduledTime,
                  adminMessage: (formData.get("adminMessage") as string) || item.adminMessage,
                }
              : item
          )
        );
        setMessage({ text: "Live validé et programmé avec succès !", type: "success" });
        setEditingLive(null);
      } else {
        setMessage({ text: res.error || "Erreur de validation", type: "error" });
      }
    });
  };

  const handleRejectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rejectingLive) return;

    const formData = new FormData();
    formData.set("liveId", rejectingLive.id);
    formData.set("status", "rejected");
    formData.set("adminMessage", rejectReason || "Créneau non disponible ou demande non conforme.");

    startTransition(async () => {
      const res = await reviewLiveAction(null, formData);
      if (res.ok) {
        setLives((prev) =>
          prev.map((item) =>
            item.id === rejectingLive.id
              ? {
                  ...item,
                  status: "rejected",
                  adminMessage: rejectReason,
                }
              : item
          )
        );
        setMessage({ text: "Demande refusée avec notification du motif.", type: "success" });
        setRejectingLive(null);
        setRejectReason("");
      } else {
        setMessage({ text: res.error || "Erreur lors du refus", type: "error" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications retour */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Barre de filtres & métriques */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Toutes ({lives.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === "pending"
              ? "bg-amber-500 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>En attente ({pendingCount})</span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter("live")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === "live"
              ? "bg-red-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>En Direct ({liveCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "approved"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Programmés ({approvedCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === "rejected"
              ? "bg-rose-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Refusés ({rejectedCount})
        </button>
      </div>

      {/* Liste des demandes */}
      {filteredLives.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Aucun live ne correspond à ce filtre pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLives.map((live) => {
            const conflicts = checkDateConflict(live);
            const hasConflict = conflicts.length > 0;

            return (
              <div
                key={live.id}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header de la carte */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/20 px-2.5 py-0.5 rounded-full">
                        {live.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          live.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : live.status === "live"
                            ? "bg-red-600 text-white animate-pulse"
                            : live.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {live.status === "approved" && "Programmé"}
                        {live.status === "live" && "En Direct"}
                        {live.status === "rejected" && "Refusé"}
                        {live.status === "pending" && "En attente"}
                        {live.status === "ended" && "Terminé"}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {live.title}
                    </h2>
                  </div>

                  {/* Boutons d'action rapide */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {live.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(live.id, "live")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        title="Passer immédiatement ce live en DIRECT pour tous les utilisateurs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Diffuser en DIRECT</span>
                      </button>
                    )}

                    {live.status === "live" && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(live.id, "ended")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                        title="Mettre fin au direct"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Terminer le direct</span>
                      </button>
                    )}

                    {live.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingLive(live)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valider créneau</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingLive(live);
                            setRejectReason("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Refuser</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(live.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {live.description}
                </p>

                {/* Métadonnées & vérification des disponibilités */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Intervenant</span>
                      <span className="font-semibold">{live.applicantName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Téléphone</span>
                      <a href={`tel:${live.applicantPhone}`} className="font-semibold text-emerald-700 hover:underline">
                        {live.applicantPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-[#1B4D0F] shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Date & Heure</span>
                      <span className="font-semibold">{live.scheduledDate} à {live.scheduledTime} ({live.durationMinutes} min)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Google Meet</span>
                      <a
                        href={live.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:underline truncate block max-w-[150px]"
                      >
                        {live.meetUrl}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Alerte de conflit de date */}
                {hasConflict && live.status === "pending" && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Attention disponibilité :</strong> Un autre live ({conflicts[0].title}) est déjà programmé à la date du {live.scheduledDate}. Vous pouvez ajuster l&apos;heure ou décaler la date avant de valider.
                    </div>
                  </div>
                )}

                {/* Message admin existant */}
                {live.adminMessage && (
                  <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700">
                    <span className="font-bold">Message communiqué à l&apos;auteur :</span> {live.adminMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Validation & Modification du Live */}
      {editingLive && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Valider et programmer le live
              </h3>
              <button
                type="button"
                onClick={() => setEditingLive(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Annuler
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lien de la salle Google Meet *
                </label>
                <input
                  type="url"
                  name="meetUrl"
                  required
                  defaultValue={editingLive.meetUrl || "https://meet.google.com/new"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ce lien s&apos;ouvrira quand les participants cliqueront sur « Participer au live ».
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date confirmée
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    defaultValue={editingLive.scheduledDate}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Heure confirmée
                  </label>
                  <input
                    type="time"
                    name="scheduledTime"
                    defaultValue={editingLive.scheduledTime}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message ou note pour l&apos;intervenant (optionnel)
                </label>
                <textarea
                  name="adminMessage"
                  rows={2}
                  defaultValue={editingLive.adminMessage || "Votre live a été approuvé avec succès ! Votre créneau est désormais officiel."}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLive(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer & Publier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rejet du Live */}
      {rejectingLive && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-5 h-5" />
                <span>Refuser la demande de live</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingLive(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Annuler
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Expliquez à l&apos;auteur pourquoi ce créneau ou cette session ne peut pas être validé(e) :
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex : Le créneau de cette date est déjà réservé. Merci de proposer une date ultérieure."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
              ></textarea>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingLive(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending || !rejectReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Confirmer le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
