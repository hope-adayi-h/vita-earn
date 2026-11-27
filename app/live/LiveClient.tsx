"use client";

import { useState, useTransition } from "react";
import {
  Video,
  Radio,
  Bell,
  BellRing,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Info,
} from "lucide-react";
import type { LiveConference } from "@/lib/data/live-store";
import { submitLiveRequestAction, toggleLiveReminderAction } from "./actions";

interface LiveClientProps {
  lives: LiveConference[];
  initialSubscribedIds: string[];
  currentUser: {
    id: string;
    identifier: string;
    name: string;
    isActivated: boolean;
  };
}

export function LiveClient({
  lives,
  initialSubscribedIds,
  currentUser,
}: LiveClientProps) {
  const [activeTab, setActiveTab] = useState<"list" | "request" | "my_requests">("list");
  const [subscribedIds, setSubscribedIds] = useState<string[]>(initialSubscribedIds);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  // Form states
  const [isPending, startTransition] = useTransition();
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter lives
  const activeLives = lives.filter((l) => l.status === "live");
  const scheduledLives = lives.filter((l) => l.status === "approved");
  const myRequests = lives.filter(
    (l) => l.userId === currentUser.id || l.applicantPhone === currentUser.identifier
  );

  const handleToggleReminder = async (liveId: string) => {
    setIsSubscribing(liveId);
    try {
      const res = await toggleLiveReminderAction(liveId);
      if (res.ok) {
        if (res.isSubscribed) {
          setSubscribedIds((prev) => [...prev, liveId]);
        } else {
          setSubscribedIds((prev) => prev.filter((id) => id !== liveId));
        }
      }
    } finally {
      setIsSubscribing(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitLiveRequestAction(null, formData);
      if (res.ok) {
        setFormSuccess(res.message || "Votre demande a été enregistrée avec succès !");
        (e.target as HTMLFormElement).reset();
        setActiveTab("my_requests");
      } else {
        setFormError(res.error || "Une erreur est survenue.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Onglets de navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "list"
              ? "bg-[#1B4D0F] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400" />
          <span>Conférences & Lives ({activeLives.length + scheduledLives.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("request")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "request"
              ? "bg-[#1B4D0F] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Demander un Live</span>
        </button>

        {myRequests.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("my_requests")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "my_requests"
                ? "bg-[#1B4D0F] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <User className="w-4 h-4 text-blue-400" />
            <span>Mes demandes ({myRequests.length})</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LISTE DES LIVES (EN DIRECT + PROGRAMMÉS)           */}
      {/* ========================================================= */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* Section 1 : Lives Actuellement en Direct */}
          {activeLives.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                <h2 className="text-base font-black text-red-600 tracking-wide uppercase">
                  En Direct Maintenant
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeLives.map((live) => (
                  <div
                    key={live.id}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-red-900 text-white p-5 sm:p-7 shadow-xl border-2 border-red-500/80"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
                            <Radio className="w-3.5 h-3.5" />
                            En Direct
                          </span>
                          <span className="text-xs text-red-200/90 font-medium">
                            {live.category}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                          {live.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl line-clamp-2">
                          {live.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-red-400" />
                            Intervenant : <strong>{live.applicantName}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-red-400" />
                            Durée : ~{live.durationMinutes} min
                          </span>
                        </div>
                      </div>

                      {/* Bouton Participer Rouge Proéminent */}
                      <a
                        href={live.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm sm:text-base tracking-wide shadow-lg shadow-red-600/50 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto shrink-0"
                      >
                        <Video className="w-5 h-5 animate-bounce" />
                        <span>Participer au live</span>
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2 : Lives Programmés (A Venir) */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Prochaines Sessions Programmées
            </h2>

            {scheduledLives.length === 0 && activeLives.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Video className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">
                    Aucune conférence en direct pour le moment
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    De nouvelles formations et sessions en direct sont régulièrement validées par l&apos;administration. Vous avez une expertise à partager ? Proposez votre live dès maintenant !
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("request")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4D0F] hover:bg-[#2F7A1A] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Proposer un Live</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduledLives.map((live) => {
                  const isSubscribed = subscribedIds.includes(live.id);
                  return (
                    <div
                      key={live.id}
                      className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/20 px-2.5 py-1 rounded-full">
                            {live.category}
                          </span>

                          {/* Bouton Cloche de Rappel */}
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(live.id)}
                            disabled={isSubscribing === live.id}
                            title={isSubscribed ? "Rappel activé (cliquez pour retirer)" : "Activer le rappel"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isSubscribed
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                            }`}
                          >
                            {isSubscribed ? (
                              <>
                                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                                <span>Rappel activé</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-3.5 h-3.5 text-slate-500" />
                                <span>M&apos;alerter</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {live.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-3 mt-1.5">
                            {live.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-[#1B4D0F]" />
                            {live.scheduledDate}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-[#1B4D0F]" />
                            {live.scheduledTime} GMT
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            {live.applicantName}
                          </span>
                        </div>

                        {/* Lien de redirection Meet prévu */}
                        <div className="pt-1">
                          <a
                            href={live.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Accéder à la salle Google Meet</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FORMULAIRE DE DEMANDE DE LIVE                      */}
      {/* ========================================================= */}
      {activeTab === "request" && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Formulaire de demande de live
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Renseignez les détails de votre événement en ligne. L&apos;administration vérifiera la disponibilité du créneau avant de le publier officiellement.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/70 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed font-medium space-y-1">
              <p>
                <strong>Processus de validation :</strong> Chaque proposition est vérifiée pour garantir qu&apos;aucun autre live ne chevauche le créneau horaire.
              </p>
              <p>
                Vous recevrez la confirmation et le lien Google Meet sera rendu public auprès de tous les membres Vita Earn.
              </p>
            </div>
          </div>

          {formSuccess && (
            <div className="p-4 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 bg-red-100 text-red-800 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom de l&apos;intervenant / Formateur *
                </label>
                <input
                  type="text"
                  name="applicantName"
                  required
                  defaultValue={currentUser.name || ""}
                  placeholder="Ex : Jean Koffi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone WhatsApp *
                </label>
                <input
                  type="tel"
                  name="applicantPhone"
                  required
                  placeholder="Ex : +228 90 00 00 00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de la conférence / live *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex : Comment monétiser ses compétences en ligne"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  name="category"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-hidden focus:border-[#1B4D0F]"
                >
                  <option value="Formation & Compétences">Formation & Compétences</option>
                  <option value="Conférence & Business">Conférence & Business</option>
                  <option value="Présentation Produit Digital">Présentation Produit Digital</option>
                  <option value="Opportunités & Réseautage">Opportunités & Réseautage</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date souhaitée *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Heure souhaitée (GMT) *
                </label>
                <input
                  type="time"
                  name="scheduledTime"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durée estimée (minutes)
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  min="15"
                  max="360"
                  defaultValue="60"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lien Google Meet (optionnel, ou laissé à l&apos;admin)
              </label>
              <input
                type="url"
                name="meetUrl"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Si vous n&apos;avez pas de lien, l&apos;administrateur créera une salle Google Meet pour vous lors de la validation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Objectif du live *
              </label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Détaillez le programme du live, ce que les participants vont apprendre ou découvrir..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#1B4D0F]"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-6 rounded-2xl bg-[#1B4D0F] hover:bg-[#2F7A1A] text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#7ED321]" />
                  <span>Envoyer la demande de live</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MES DEMANDES DE LIVE                               */}
      {/* ========================================================= */}
      {activeTab === "my_requests" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-800">
            Historique de mes propositions de Live
          </h2>

          <div className="space-y-3">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{req.title}</h3>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      req.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "live"
                        ? "bg-red-100 text-red-800 animate-pulse"
                        : req.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status === "approved" && "Validé & Programmé"}
                    {req.status === "live" && "En Direct"}
                    {req.status === "rejected" && "Refusé"}
                    {req.status === "pending" && "En attente d'approbation"}
                    {req.status === "ended" && "Terminé"}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{req.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5" />
                    {req.scheduledDate} à {req.scheduledTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {req.durationMinutes} min
                  </span>
                </div>

                {req.adminMessage && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <strong>Message de l&apos;admin :</strong> {req.adminMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
