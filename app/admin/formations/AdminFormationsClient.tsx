"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { compressImageFileToDataUrl } from "@/lib/utils/image-resize";
import { createFormationAction, deleteFormationAction } from "./actions";
import type { StoredFormationItem } from "@/lib/data/formations-store";

interface AdminFormationsClientProps {
  initialItems: StoredFormationItem[];
}

export function AdminFormationsClient({ initialItems }: AdminFormationsClientProps) {
  const [items, setItems] = useState<StoredFormationItem[]>(initialItems);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    setIsUploadingImg(true);
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 0.8);
      setImageUrl(compressed);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erreur lors du chargement de l'image.",
      });
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createFormationAction({
        title,
        description,
        imageUrl,
        downloadUrl,
      });

      if (res.success && res.items) {
        setItems(res.items);
        setTitle("");
        setDescription("");
        setImageUrl("");
        setDownloadUrl("");
        setFeedback({ type: "success", text: res.message || "Formation ajoutée." });
      } else {
        setFeedback({ type: "error", text: res.error || "Impossible d'ajouter la formation." });
      }
    });
  };

  const handleDelete = (id: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteFormationAction(id);
      setConfirmDeleteId(null);
      if (res.success && res.items) {
        setItems(res.items);
        setFeedback({ type: "success", text: res.message || "Formation supprimée." });
      } else {
        setFeedback({ type: "error", text: res.error || "Erreur lors de la suppression." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Formations Publiées
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {items.length} formation(s)
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Aperçu côté membre
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Chaque formation ajoutée ici apparaît immédiatement sur la page Formations avec son bouton « Télécharger la formation ».
            </p>
          </div>
          <Link
            href="/formations"
            target="_blank"
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold w-fit"
          >
            <span>Voir sur le site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Formulaire d'ajout de formation */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0084FF] flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Ajouter une formation</h2>
            <p className="text-xs text-slate-500">
              Ajoutez une image de couverture, un titre, une description et le lien PDF / Google Drive / Share.
            </p>
          </div>
        </div>

        {/* Image : Upload ou URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Image de la formation *
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 transition-colors">
              {isUploadingImg ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0084FF]" />
              ) : (
                <Upload className="w-4 h-4 text-[#0084FF]" />
              )}
              <span>Importer une image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </label>
            <span className="text-[11px] font-bold text-slate-400">OU</span>
            <div className="relative flex-1 w-full">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={imageUrl.startsWith("data:") ? "" : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Coller l'URL d'une image (https://...)"
                className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0084FF]"
              />
            </div>
          </div>

          {imageUrl && (
            <div className="mt-2 relative w-full max-w-xs h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Aperçu formation" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Titre de la formation *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Guide complet du Marketing Digital"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0084FF]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
              <Link2 className="w-3.5 h-3.5 text-[#0084FF]" />
              <span>Lien PDF / Google Drive / Share *</span>
            </label>
            <input
              type="url"
              required
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/... ou https://.../cours.pdf"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0084FF]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Description de la formation *
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Présentez le contenu de la formation et ce que les membres vont apprendre..."
            className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0084FF]"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isUploadingImg || !imageUrl}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publication...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Publier la formation</span>
            </>
          )}
        </button>
      </form>

      {/* Catalogue actuel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-slate-900">
          Catalogue des Formations ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Aucune formation publiée pour le moment. Utilisez le formulaire ci-dessus pour ajouter votre première formation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-20 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0084FF] hover:underline"
                    >
                      <span className="truncate max-w-xs">{item.downloadUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(item.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
