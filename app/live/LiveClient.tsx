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
  Camera,
  Trash2,
  AlertTriangle,
  CalendarDays,
  ImageIcon,
} from "lucide-react";
import {
  DAYS_OF_WEEK,
  type LiveConference,
  type LiveSettings,
} from "@/lib/data/live-types";
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
  initialSettings: LiveSettings;
  initialWeekStats: {
    mondayStr: string;
    sundayStr: string;
    maxSlots: number;
    occupiedSlots: number;
    remainingSlots: number;
    isFull: boolean;
    allowedDaysOfWeek: number[];
    allowedDayNames: string[];
    noticeMessage: string;
  };
}

export function LiveClient({
  lives,
  initialSubscribedIds,
  currentUser,
  initialSettings,
  initialWeekStats,
}: LiveClientProps) {
  const [activeTab, setActiveTab] = useState<"list" | "request" | "my_requests">("list");
  const [subscribedIds, setSubscribedIds] = useState<string[]>(initialSubscribedIds);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  // Settings & Quotas
  const [settings] = useState<LiveSettings>(initialSettings);
  const [weekStats] = useState(initialWeekStats);

  // Form states
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
    setDateWarning(null);

    if (!val) return;

    try {
      const parts = val.split("-").map(Number);
      const targetDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
      const dayOfWeek = targetDate.getUTCDay();

      if (!settings.allowedDaysOfWeek.includes(dayOfWeek)) {
        const dayObj = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek);
        const dayName = dayObj ? dayObj.label : "Ce jour";
        setDateWarning(
          `Attention : ${dayName} n'est pas un jour de live autorisé. Jours disponibles : ${weekStats.allowedDayNames.join(", ")}.`
        );
      }
    } catch {}
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);

    if (dateWarning) {
      setFormError("Veuillez choisir une date correspondant aux jours ouverts autorisés par l'administration.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    if (photoPreview) {
      formData.set("coverImageUrl", photoPreview);
    }

    startTransition(async () => {
      const res = await submitLiveRequestAction(null, formData);
      if (res.ok) {
        setFormSuccess(res.message || "Votre demande a été enregistrée avec succès !");
        (e.target as HTMLFormElement).reset();
        setPhotoPreview("");
        setSelectedDate("");
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
          {weekStats.remainingSlots > 0 ? (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-800 font-extrabold">
              {weekStats.remainingSlots} place(s)
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-800 font-extrabold">
              Plein
            </span>
          )}
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
                      <div className="flex items-start gap-4">
                        {live.coverImageUrl && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-red-400/40 shrink-0 shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={live.coverImageUrl}
                              alt={live.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
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

                        <div className="flex items-start gap-3">
                          {live.coverImageUrl && (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={live.coverImageUrl}
                                alt={live.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-slate-900 leading-snug">
                              {live.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-3 mt-1.5">
                              {live.description}
                            </p>
                          </div>
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
              Renseignez les détails de votre événement en ligne. L&apos;administration vérifiera la conformité et la disponibilité avant de le publier officiellement.
            </p>
          </div>

          {/* BANDEAU QUOTAS ET CONDITIONS FIXÉES PAR L'ADMINISTRATEUR */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-[#F4F7F0] rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#1B4D0F] shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  Règles & Disponibilités ({weekStats.mondayStr} au {weekStats.sundayStr})
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                  weekStats.isFull
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                {weekStats.isFull
                  ? "Toutes les places sont occupées pour cette semaine"
                  : `${weekStats.remainingSlots} place(s) disponible(s) sur ${settings.maxSlotsPerWeek}`}
              </span>
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <p>
                <strong>Jours de live autorisés :</strong>{" "}
                <span className="font-semibold text-[#1B4D0F]">
                  {weekStats.allowedDayNames.join(", ")}
                </span>.
              </p>
              {settings.noticeMessage && (
                <p className="italic text-slate-600 bg-white/70 p-2 rounded-xl border border-emerald-100">
                  {settings.noticeMessage}
                </p>
              )}
            </div>

            {weekStats.isFull && (
              <div className="p-3 bg-rose-50 text-rose-900 rounded-xl border border-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Le quota maximum de <strong>{settings.maxSlotsPerWeek} places</strong> pour cette semaine est atteint. Vous pouvez proposer une date pour la semaine suivante ou patienter jusqu&apos;à la prochaine session.
                </span>
              </div>
            )}
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

            {/* Date, Heure & Durée avec validation dynamique des jours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date souhaitée *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  required
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 focus:outline-hidden ${
                    dateWarning
                      ? "border-rose-400 bg-rose-50/50"
                      : "border-slate-300 focus:border-[#1B4D0F]"
                  }`}
                />
                {dateWarning && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1">
                    {dateWarning}
                  </p>
                )}
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

            {/* Photo de l'intervenant ou du produit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Photo de profil de l&apos;intervenant ou image du produit / formation (Optionnel)
              </label>

              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Aperçu photo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview("")}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#1B4D0F] bg-slate-50 hover:bg-emerald-50/40 cursor-pointer transition-colors shrink-0">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-600 text-center px-1">
                      Ajouter photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>
                    Vous pouvez charger une photo claire de vous ou une bannière de votre formation.
                  </p>
                  <p>Format JPG, PNG ou WEBP (max 2 Mo).</p>
                </div>
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
              disabled={isPending || Boolean(dateWarning)}
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
