"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  MapPin,
  ExternalLink,
  Plus,
  X,
  Upload,
  User,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import { compressImageFileToDataUrl } from "@/lib/utils/image-resize";
import { createEmploiPostAction } from "./actions";
import type { StoredEmploiPost } from "@/lib/data/emploi-store";

interface EmploiClientProps {
  initialPosts: StoredEmploiPost[];
}

export function EmploiClient({ initialPosts }: EmploiClientProps) {
  const [posts, setPosts] = useState<StoredEmploiPost[]>(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Champs du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [profession, setProfession] = useState("");
  const [description, setDescription] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageFileToDataUrl(file, 500, 0.78);
      setPhotoUrl(compressed);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erreur lors du chargement de la photo.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createEmploiPostAction({
        firstName,
        lastName,
        location,
        profession,
        description,
        serviceUrl,
        photoUrl,
      });

      if (res.success && res.post) {
        setPosts((prev) => [res.post!, ...prev]);
        setFirstName("");
        setLastName("");
        setLocation("");
        setProfession("");
        setDescription("");
        setServiceUrl("");
        setPhotoUrl("");
        setShowForm(false);
        setFeedback({
          type: "success",
          text: res.message || "Votre profil a été publié immédiatement.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Impossible de publier votre annonce.",
        });
      }
    });
  };

  const filteredPosts = posts.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.profession.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Barre d'action : Publier + Recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setFeedback(null);
          }}
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#1B4D0F] hover:bg-[#2F7A1A] text-white text-xs sm:text-sm font-black shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              <span>Fermer le formulaire</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-[#7ED321]" />
              <span>Publier mon emploi / profil</span>
            </>
          )}
        </button>

        {posts.length > 0 && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher métier, ville, nom..."
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:border-[#2F7A1A]"
            />
          </div>
        )}
      </div>

      {/* Message de retour */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-red-50 border-red-200 text-red-950"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Formulaire de publication utilisateur */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 rounded-3xl bg-[#F4F7F0] border border-[#1B4D0F]/20 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-base font-black text-[#14201A]">
              Publier votre profil professionnel
            </h2>
            <p className="text-xs text-[#5B6B60]">
              Renseignez vos informations et votre activité. Votre annonce apparaîtra directement sur la page Emploi.
            </p>
          </div>

          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors">
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#2F7A1A]" />
                ) : (
                  <Upload className="w-4 h-4 text-[#2F7A1A]" />
                )}
                <span>{photoUrl ? "Changer la photo" : "Ajouter votre photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#5B6B60]">Format JPG, PNG ou WebP (max 6 Mo)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#14201A] block mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Mensah"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14201A] block mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Kofi"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14201A] block mb-1">
                Lieu de résidence *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Lomé, Agoè"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14201A] block mb-1">
                Profession / Travail *
              </label>
              <input
                type="text"
                required
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Ex: Créateur de contenu, Graphiste..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#14201A] block mb-1">
              Description de votre travail *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez vos compétences, votre expérience ou les services que vous proposez..."
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#14201A] block mb-1">
              Lien site web ou services (optionnel)
            </label>
            <input
              type="url"
              value={serviceUrl}
              onChange={(e) => setServiceUrl(e.target.value)}
              placeholder="https://mon-portfolio.com ou https://wa.me/..."
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isUploadingPhoto}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#1B4D0F] hover:bg-[#2F7A1A] disabled:opacity-60 text-white font-black text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publication en cours...</span>
              </>
            ) : (
              <span>Publier immédiatement</span>
            )}
          </button>
        </form>
      )}

      {/* Liste des emplois publiés */}
      {filteredPosts.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#2F7A1A] flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-[#14201A]">
            {posts.length === 0
              ? "Aucun profil ou emploi publié pour le moment"
              : "Aucun résultat pour cette recherche"}
          </h3>
          <p className="text-xs text-[#5B6B60] max-w-sm mx-auto">
            {posts.length === 0
              ? "Soyez le premier à présenter votre métier, vos services ou vos créations aux membres de Vita Earn."
              : "Essayez avec un autre mot-clé (métier, ville ou nom)."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-[#2F7A1A]/40 hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F7F0] border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {post.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.photoUrl}
                      alt={`${post.firstName} ${post.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black text-[#1B4D0F]">
                      {post.firstName.charAt(0).toUpperCase()}
                      {post.lastName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm sm:text-base font-black text-[#14201A]">
                      {post.firstName} {post.lastName}
                    </h2>
                    <span className="text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/25 px-2.5 py-0.5 rounded-full">
                      {post.profession}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#5B6B60]">
                    <MapPin className="w-3.5 h-3.5 text-[#2F7A1A] shrink-0" />
                    <span>{post.location}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#14201A]/90 leading-relaxed whitespace-pre-line">
                {post.description}
              </p>

              {post.serviceUrl && (
                <div className="pt-1">
                  <a
                    href={post.serviceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#1B4D0F] hover:bg-[#2F7A1A] text-white text-xs font-bold transition-colors"
                  >
                    <span>Voir le site / service</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#7ED321]" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
