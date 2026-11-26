"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Camera,
  CreditCard,
  Loader2,
} from "lucide-react";
import { compressImageFileToDataUrl } from "@/lib/utils/image-resize";
import { submitSellerKycAction } from "@/app/vendre/actions";
import type { KycDocumentType, StoredKycRequest } from "@/lib/data/kyc-store";

interface SellerKycGateProps {
  initialKyc: StoredKycRequest | null;
  defaultFullName: string;
  defaultPhone: string;
  onSubmitted: (kyc: StoredKycRequest) => void;
}

export function SellerKycGate({
  initialKyc,
  defaultFullName,
  defaultPhone,
  onSubmitted,
}: SellerKycGateProps) {
  const [kyc, setKyc] = useState<StoredKycRequest | null>(initialKyc);
  const [documentType, setDocumentType] = useState<KycDocumentType>(
    initialKyc?.documentType || "cni"
  );
  const [fullName, setFullName] = useState(initialKyc?.fullName || defaultFullName);
  const [phone, setPhone] = useState(initialKyc?.phone || defaultPhone);
  const [frontImageUrl, setFrontImageUrl] = useState(initialKyc?.frontImageUrl || "");
  const [backImageUrl, setBackImageUrl] = useState(initialKyc?.backImageUrl || "");
  const [selfieImageUrl, setSelfieImageUrl] = useState(initialKyc?.selfieImageUrl || "");

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = async (
    field: "front" | "back" | "selfie",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    setUploadingField(field);
    try {
      const compressed = await compressImageFileToDataUrl(file, 720, 0.78);
      if (field === "front") setFrontImageUrl(compressed);
      if (field === "back") setBackImageUrl(compressed);
      if (field === "selfie") setSelfieImageUrl(compressed);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Erreur lors du chargement de la photo.",
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!frontImageUrl || !backImageUrl || !selfieImageUrl) {
      setFeedback({
        type: "error",
        text: "Les 3 photos (avant de la pièce, arrière de la pièce et photo du visage) sont obligatoires.",
      });
      return;
    }

    startTransition(async () => {
      const res = await submitSellerKycAction({
        documentType,
        fullName,
        phone,
        frontImageUrl,
        backImageUrl,
        selfieImageUrl,
      });

      if (res.success && res.kyc) {
        setKyc(res.kyc);
        onSubmitted(res.kyc);
        setFeedback({
          type: "success",
          text: "Votre dossier KYC a été envoyé à l'administrateur pour validation.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Impossible d'envoyer votre dossier KYC.",
        });
      }
    });
  };

  if (kyc?.status === "pending") {
    return (
      <div className="max-w-xl mx-auto pt-6 pb-16 px-4">
        <div className="bg-white rounded-[28px] border border-amber-200 p-6 sm:p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-[#14201A]">
            Vérification KYC en cours d&apos;examen
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6B60] leading-relaxed max-w-md mx-auto">
            Vos documents ({kyc.documentType === "cni" ? "Carte d'identité" : "Carte scolaire"} recto/verso + photo du visage) ont bien été reçus. Dès que l&apos;administrateur validera votre identité, votre compte sera vérifié et vous pourrez publier vos articles.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Statut : En attente de validation admin</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-4 pb-16 px-4 space-y-5">
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4D0F] text-[#7ED321] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#14201A]">
              Vérification Vendeur (KYC Obligatoire)
            </h1>
            <p className="text-xs text-[#5B6B60]">
              Faites vérifier votre identité avant de publier sur la Marketplace
            </p>
          </div>
        </div>

        {kyc?.status === "rejected" && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black">Votre précédente demande KYC a été refusée</p>
              <p className="mt-0.5">
                Motif : {kyc.rejectionReason || "Documents non conformes ou illisibles."}
              </p>
              <p className="mt-1 font-medium">
                Vous ne pouvez pas publier d&apos;articles tant que votre KYC n&apos;est pas validé. Veuillez soumettre des photos nettes ci-dessous.
              </p>
            </div>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choix du document */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#14201A] block">
              Type de pièce d&apos;identité *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocumentType("cni")}
                className={`min-h-[44px] p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  documentType === "cni"
                    ? "bg-[#1B4D0F] text-white border-[#1B4D0F]"
                    : "bg-[#F4F7F0] text-[#14201A] border-slate-200"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Carte d&apos;identité</span>
              </button>
              <button
                type="button"
                onClick={() => setDocumentType("school_card")}
                className={`min-h-[44px] p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  documentType === "school_card"
                    ? "bg-[#1B4D0F] text-white border-[#1B4D0F]"
                    : "bg-[#F4F7F0] text-[#14201A] border-slate-200"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Carte scolaire</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#14201A] block mb-1">
                Nom et prénom sur la pièce *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Kofi Mensah"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#14201A] block mb-1">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +228 90 00 00 00"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#14201A] focus:outline-hidden focus:border-[#2F7A1A]"
              />
            </div>
          </div>

          {/* 3 Photos obligatoires */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              {
                key: "front" as const,
                label: "Photo Avant (Recto)",
                value: frontImageUrl,
                icon: Upload,
              },
              {
                key: "back" as const,
                label: "Photo Arrière (Verso)",
                value: backImageUrl,
                icon: Upload,
              },
              {
                key: "selfie" as const,
                label: "Photo de votre Visage",
                value: selfieImageUrl,
                icon: Camera,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isUploading = uploadingField === item.key;
              return (
                <label
                  key={item.key}
                  className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#2F7A1A] bg-[#F4F7F0]/60 p-3 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-colors min-h-[140px]"
                >
                  {item.value ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.value}
                      alt={item.label}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                  ) : isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#2F7A1A]" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#2F7A1A]">
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-[#14201A]">{item.label} *</span>
                  <span className="text-[10px] text-[#5B6B60]">
                    {item.value ? "Cliquer pour remplacer" : "Importer une photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(item.key, e)}
                    className="hidden"
                  />
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isPending || Boolean(uploadingField)}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#1B4D0F] hover:bg-[#2F7A1A] disabled:opacity-60 text-white font-black text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#7ED321]" />
                <span>Envoyer mon KYC pour validation</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
