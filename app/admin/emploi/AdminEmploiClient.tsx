"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  Loader2,
} from "lucide-react";
import { deleteEmploiPostAction } from "./actions";
import type { StoredEmploiPost } from "@/lib/data/emploi-store";

interface AdminEmploiClientProps {
  initialPosts: StoredEmploiPost[];
}

export function AdminEmploiClient({ initialPosts }: AdminEmploiClientProps) {
  const [posts, setPosts] = useState<StoredEmploiPost[]>(initialPosts);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteEmploiPostAction(id);
      setConfirmDeleteId(null);
      if (res.success && res.posts) {
        setPosts(res.posts);
        setFeedback({ type: "success", text: res.message || "Publication supprimée." });
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
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Emplois & Profils Publiés
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {posts.length} publication(s)
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Page Publique Emploi
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Les membres publient directement. Vous pouvez consulter toutes leurs informations et supprimer toute publication ici.
            </p>
          </div>
          <Link
            href="/emploi"
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

      {/* Liste */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-slate-900">
          Profils & Emplois postés par les utilisateurs
        </h2>

        {posts.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Aucun emploi publié par les utilisateurs pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {post.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.photoUrl}
                        alt={`${post.firstName} ${post.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {post.firstName} {post.lastName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0084FF] border border-blue-200">
                        {post.profession}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {post.location}
                      </span>
                      <span>
                        Publié le {new Date(post.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {post.description}
                    </p>

                    {post.serviceUrl && (
                      <a
                        href={post.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0084FF] hover:underline pt-1"
                      >
                        <span>{post.serviceUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions suppression inline */}
                <div className="shrink-0 self-end sm:self-start">
                  {confirmDeleteId === post.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(post.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>Confirmer</span>
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
                      onClick={() => setConfirmDeleteId(post.id)}
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
