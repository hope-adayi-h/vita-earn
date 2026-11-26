"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Phone,
  Loader2,
  X,
} from "lucide-react";
import { reviewSellerKycAction } from "./actions";
import type { StoredKycRequest } from "@/lib/data/kyc-store";

interface AdminKycClientProps {
  initialItems: StoredKycRequest[];
}

export function AdminKycClient({ initialItems }: AdminKycClientProps) {
  const [items, setItems] = useState<StoredKycRequest[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDecision = (
    id: string,
    decision: "approved" | "rejected",
    reason?: string
  ) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await reviewSellerKycAction({ id, decision, reason });
      setRejectingId(null);
      setRejectReason("");
      if (res.success && res.items) {
        setItems(res.items);
        setFeedback({ type: "success", text: res.message || "Statut mis à jour." });
      } else {
        setFeedback({ type: "error", text: res.error || "Erreur lors de l'opération." });
      }
    });
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const approvedCount = items.filter((i) => i.status === "approved").length;
  const rejectedCount = items.filter((i) => i.status === "rejected").length;

  const filteredItems = items.filter((i) => (filter === "all" ? true : i.status === filter));

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            En attente
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{pendingCount} dossier(s)</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Vendeurs Vérifiés
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{approvedCount} validé(s)</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mb-3">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Refusés
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{rejectedCount} refusé(s)</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "pending" as const, label: `En attente (${pendingCount})` },
          { key: "approved" as const, label: `Validés (${approvedCount})` },
          { key: "rejected" as const, label: `Refusés (${rejectedCount})` },
          { key: "all" as const, label: `Tous (${items.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === tab.key
                ? "bg-[#0084FF] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Liste des dossiers KYC */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-xs text-slate-500">
          Aucune demande KYC dans cette catégorie.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4"
            >
              {/* En-tête */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900">{req.fullName}</h3>
                    <span className="text-xs font-bold text-slate-500">@{req.username}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0084FF] border border-blue-200">
                      <CreditCard className="w-3 h-3" />
                      <span>
                        {req.documentType === "cni" ? "Carte d'identité" : "Carte scolaire"}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-[#0084FF]" />
                      {req.phone}
                    </span>
                    <span>Soumis le {new Date(req.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                <div>
                  {req.status === "approved" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Compte Vérifié</span>
                    </span>
                  ) : req.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Refusé</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>En attente</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Photos (Recto, Verso, Visage) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Photo Avant (Recto)", src: req.frontImageUrl },
                  { label: "Photo Arrière (Verso)", src: req.backImageUrl },
                  { label: "Photo du Visage (Selfie)", src: req.selfieImageUrl },
                ].map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setPreviewImage({ src: img.src, title: `${req.fullName} — ${img.label}` })}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-2 text-left hover:border-[#0084FF] transition-colors cursor-pointer"
                  >
                    <div className="h-36 rounded-xl overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="block text-[11px] font-bold text-slate-700 mt-2 text-center">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>

              {req.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>Motif du refus :</strong> {req.rejectionReason}
                </div>
              )}

              {/* Boutons Valider / Refuser */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {req.status !== "approved" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDecision(req.id, "approved")}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Valider le KYC</span>
                  </button>
                )}

                {rejectingId === req.id ? (
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Motif du refus (ex: photo floue)..."
                      className="flex-1 min-w-[180px] min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDecision(req.id, "rejected", rejectReason)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirmer le refus
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ) : req.status !== "rejected" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setRejectingId(req.id)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Refuser</span>
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal zoom photo */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-4 space-y-3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900">{previewImage.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.src}
              alt={previewImage.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
