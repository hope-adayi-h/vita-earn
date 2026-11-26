"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { publishProductAction, type SellerDashboardData } from "./actions";
import { SellerKycGate } from "@/components/vendre/SellerKycGate";
import { WhatsAppLogo } from "@/components/WhatsAppLogo";
import {
  ShoppingBag,
  Package,
  Zap,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface VendreClientProps {
  initialData: SellerDashboardData | null;
}

export function VendreClient({ initialData }: VendreClientProps) {
  const [activeTab, setActiveTab] = useState<"publish" | "my_products">("publish");
  const [data, setData] = useState(initialData);

  // Form state
  const [productType, setProductType] = useState<"physical" | "service" | "digital">("physical");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("tech");
  const [description, setDescription] = useState("");
  const [sellerPhone, setSellerPhone] = useState(initialData?.user.phone || "");
  const [sellerLocation, setSellerLocation] = useState(
    initialData?.user.country === "TG" ? "Lomé, Togo" : "Afrique de l'Ouest"
  );
  const [digitalLink, setDigitalLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission state
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!data || !data.isActivated) {
    return (
      <div className="max-w-xl mx-auto pt-6 px-4">
        <div className="bg-white rounded-3xl border border-vita-border p-6 sm:p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-vita-deep mb-2">
            Activation requise pour vendre
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted max-w-md mx-auto mb-6">
            Conformément aux règles de Vita Earn, l'espace vendeur et la publication d'articles sont
            strictement réservés aux comptes activés.
          </p>
          <Link
            href="/activation"
            className="touch-target px-6 py-3 rounded-2xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs sm:text-sm transition-all shadow-md inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-vita-bright" />
            <span>Activer mon compte vendeur (4 500 FCFA)</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!data.isKycVerified) {
    return (
      <SellerKycGate
        initialKyc={data.kyc}
        defaultFullName={data.user.fullName}
        defaultPhone={data.user.phone}
        onSubmitted={(kyc) => setData((prev) => (prev ? { ...prev, kyc } : prev))}
      />
    );
  }

  const { quota, settings, myProducts } = data;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Veuillez sélectionner un fichier image valide (JPG, PNG, WebP)." });
      return;
    }

    // Accepter jusqu'à 10 Mo grâce à la compression automatique côté client
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'image ne doit pas dépasser 10 Mo." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawData = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setImagePreview(compressed);
          setImageUrl(compressed);
        } else {
          setImagePreview(rawData);
          setImageUrl(rawData);
        }
      };
      img.onerror = () => {
        setImagePreview(rawData);
        setImageUrl(rawData);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!imageUrl) {
      setMessage({
        type: "error",
        text: "Une photo ou affiche principale de votre article est obligatoire.",
      });
      return;
    }

    if (!quota.canPublish) {
      setMessage({
        type: "error",
        text: `Vous avez atteint votre quota de ${quota.freeLimit} articles gratuits. Pour ajouter plus d'articles, veuillez contacter l'administrateur ou payer le forfait supplémentaire de ${settings.extraProductPrice} FCFA.`,
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price);
    formData.append("productType", productType);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("sellerPhone", sellerPhone);
    formData.append("sellerLocation", sellerLocation);
    formData.append("imageUrl", imageUrl);
    if (productType === "digital" && digitalLink) {
      formData.append("digitalLink", digitalLink);
    }

    startTransition(async () => {
      const res = await publishProductAction(formData);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res.product) {
        setMessage({
          type: "success",
          text: "Votre article a été envoyé avec succès ! Il est actuellement en attente de validation par l'administrateur et apparaîtra sur le marché dès son approbation.",
        });
        // Reset form
        setTitle("");
        setPrice("");
        setDescription("");
        setDigitalLink("");
        setImageUrl("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Update state
        setData((prev) => {
          if (!prev) return prev;
          const updatedMy = [res.product!, ...prev.myProducts];
          const nextPublished = prev.quota.totalPublished + 1;
          const nextCanPublish = prev.quota.isUnlimited || nextPublished < prev.quota.totalLimit;
          return {
            ...prev,
            myProducts: updatedMy,
            quota: {
              ...prev.quota,
              totalPublished: nextPublished,
              pendingCount: prev.quota.pendingCount + 1,
              freeRemaining: prev.quota.isUnlimited ? 999 : Math.max(0, prev.quota.totalLimit - nextPublished),
              canPublish: nextCanPublish,
              extraRequired: !nextCanPublish,
            },
          };
        });
        setActiveTab("my_products");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2 pb-16 px-4">
      {/* En-tête Espace Vendeur */}
      <div className="bg-gradient-to-r from-vita-deep via-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Espace Vendeur Débloqué</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Publier un Article sur le Marché
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Vendez vos produits physiques, vos services ou vos formations & ressources numériques
              aux milliers d'utilisateurs de Vita Earn.
            </p>
          </div>

          {/* Badge Quota Vendeur */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex-shrink-0 text-right">
            <div className="flex items-center justify-end gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-vita-bright" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Quota Publications
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              {quota.isUnlimited
                ? `${quota.totalPublished} / Illimité`
                : `${quota.totalPublished} / ${quota.totalLimit}`}
            </div>
            <div className="text-[11px] text-emerald-200 mt-0.5">
              {quota.isUnlimited ? (
                <span>Accès permanent autorisé</span>
              ) : quota.freeRemaining > 0 ? (
                <span>
                  {quota.freeRemaining} article{quota.freeRemaining > 1 ? "s" : ""} restant
                  {quota.freeRemaining > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-amber-300 font-bold">Quota atteint</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message d'information sur le quota */}
      {!quota.canPublish ? (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-sm">
                Vous avez atteint votre limite de publication ({quota.totalPublished} / {quota.totalLimit} article{quota.totalLimit > 1 ? "s" : ""}).
              </p>
              <p className="text-amber-900 leading-relaxed">
                Pour passer à l&apos;étape supérieure et publier d&apos;autres articles sur la Marketplace, vous devez régler l&apos;abonnement de{" "}
                <strong>{formatFCFA(settings.extraProductPrice)}</strong> directement auprès de l&apos;administrateur sur WhatsApp.
              </p>
            </div>
          </div>

          {settings.adminWhatsappNumber ? (
            <a
              href={`https://wa.me/${settings.adminWhatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Je suis là pour prendre l'abonnement de ${settings.extraProductPrice} FCFA afin de publier plus d'articles sur Vita Earn. Mon pseudo : ${data.user.username}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <WhatsAppLogo className="w-4 h-4" />
              <span>Contacter l&apos;administrateur sur WhatsApp ({formatFCFA(settings.extraProductPrice)})</span>
            </a>
          ) : (
            <p className="text-xs font-bold text-amber-800">
              Veuillez contacter l&apos;administrateur pour valider votre abonnement supplémentaire.
            </p>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {quota.isUnlimited ? (
                <>Vous disposez d&apos;un accès <strong>permanent et illimité</strong> pour publier vos articles.</>
              ) : (
                <>
                  Vous pouvez publier jusqu&apos;à <strong>{quota.totalLimit} article{quota.totalLimit > 1 ? "s" : ""}</strong> ({quota.freeRemaining} restant{quota.freeRemaining > 1 ? "s" : ""}).
                </>
              )}
            </span>
          </div>
          <Link
            href="/marche"
            className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
          >
            Voir le marché →
          </Link>
        </div>
      )}

      {/* Message de notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation par onglets */}
      <div className="flex items-center gap-2 border-b border-vita-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("publish")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "publish"
              ? "bg-vita-deep text-white shadow-sm"
              : "text-vita-muted hover:text-vita-text bg-white"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Produit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("my_products")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "my_products"
              ? "bg-vita-deep text-white shadow-sm"
              : "text-vita-muted hover:text-vita-text bg-white"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mes Articles ({myProducts.length})</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : Formulaire de Publication (masqué si quota atteint) */}
      {activeTab === "publish" && !quota.canPublish && (
        <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-[#14201A]">
            Limite de publication atteinte ({quota.totalPublished} / {quota.totalLimit})
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6B60] max-w-md mx-auto leading-relaxed">
            Vous avez déjà publié votre maximum autorisé. Pour débloquer la publication de nouveaux articles, réglez l&apos;abonnement de{" "}
            <strong>{formatFCFA(settings.extraProductPrice)}</strong> sur WhatsApp avec l&apos;administrateur, puis actualisez cette page après validation.
          </p>
          {settings.adminWhatsappNumber && (
            <a
              href={`https://wa.me/${settings.adminWhatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Je suis là pour prendre l'abonnement de ${settings.extraProductPrice} FCFA afin de publier plus d'articles sur Vita Earn. Mon pseudo : ${data.user.username}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target min-h-[44px] px-6 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <WhatsAppLogo className="w-4 h-4" />
              <span>Payer {formatFCFA(settings.extraProductPrice)} sur WhatsApp</span>
            </a>
          )}
        </div>
      )}

      {activeTab === "publish" && quota.canPublish && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl border border-vita-border p-6 sm:p-8 shadow-sm space-y-6">
            {/* 1. Type de produit */}
            <div>
              <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider mb-2">
                1. Type d'article
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setProductType("physical")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    productType === "physical"
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30"
                      : "border-vita-border bg-white hover:bg-vita-surface"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      productType === "physical"
                        ? "bg-emerald-600 text-white"
                        : "bg-vita-surface text-vita-muted"
                    }`}
                  >
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-vita-deep">Produit Physique</div>
                    <div className="text-[11px] text-vita-muted">Smartphone, montre, vêtements...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType("service")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    productType === "service"
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30"
                      : "border-vita-border bg-white hover:bg-vita-surface"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      productType === "service"
                        ? "bg-emerald-600 text-white"
                        : "bg-vita-surface text-vita-muted"
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-vita-deep">Service ou Prestation</div>
                    <div className="text-[11px] text-vita-muted">Graphisme, coaching, conseil...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType("digital")}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    productType === "digital"
                      ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30"
                      : "border-vita-border bg-white hover:bg-vita-surface"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      productType === "digital"
                        ? "bg-emerald-600 text-white"
                        : "bg-vita-surface text-vita-muted"
                    }`}
                  >
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-vita-deep">Produit Numérique</div>
                    <div className="text-[11px] text-vita-muted">E-book, Canva, formation vidéo...</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Photo / Affiche Principale (1 SEULE PHOTO OBLIGATOIRE) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider">
                  2. Affiche / Photo du produit (1 photo obligatoire)
                </label>
                <span className="text-[11px] text-vita-muted font-semibold">
                  1 seule photo requise
                </span>
              </div>

              {imagePreview ? (
                <div className="relative rounded-2xl border border-vita-border overflow-hidden bg-vita-surface max-w-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Affiche du produit"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-1.5 bg-black/70 hover:bg-black text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2 text-center bg-white/90 border-t border-vita-border text-[11px] font-bold text-emerald-700">
                    Photo sélectionnée avec succès
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-vita-border hover:border-emerald-600 rounded-3xl p-6 text-center bg-vita-surface/40 hover:bg-vita-surface transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-vita-deep">
                    Cliquez ici pour choisir une photo / affiche
                  </div>
                  <div className="text-[11px] text-vita-muted">
                    Formats acceptés : JPG, PNG, WebP (Max 5 Mo)
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Si Produit Numérique : Champ de Lien d'accès direct */}
            {productType === "digital" && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>Lien de téléchargement ou d'accès au fichier</span>
                </label>
                <input
                  type="url"
                  value={digitalLink}
                  onChange={(e) => setDigitalLink(e.target.value)}
                  placeholder="https://drive.google.com/... ou https://canva.com/..."
                  className="w-full touch-target rounded-xl border border-blue-300 bg-white px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-800">
                  Collez le lien direct vers votre ressource (Google Drive, Dropbox, Canva, Mega,
                  PDF en ligne, canal Telegram privé, etc.). Les acheteurs y auront accès
                  directement.
                </p>
              </div>
            )}

            {/* 3. Titre et Catégorie */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider">
                  Titre de l'article *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Montre Connectée Pro étanche ou Pack Canva 150 Visuels"
                  className="w-full touch-target rounded-xl border border-vita-border bg-white px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full touch-target rounded-xl border border-vita-border bg-white px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                >
                  <option value="tech">Tech & Électronique</option>
                  <option value="digital">Digital & Formations</option>
                  <option value="service">Services & Prestations</option>
                  <option value="mode">Mode & Beauté</option>
                  <option value="maison">Maison & Déco</option>
                  <option value="divers">Divers</option>
                </select>
              </div>
            </div>

            {/* 4. Prix et Localisation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider">
                  Prix de vente (en FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex. 4500"
                    className="w-full touch-target rounded-xl border border-vita-border bg-white pl-3.5 pr-16 text-xs sm:text-sm font-bold text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-vita-muted">
                    FCFA
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ville / Localisation *</span>
                </label>
                <input
                  type="text"
                  required
                  value={sellerLocation}
                  onChange={(e) => setSellerLocation(e.target.value)}
                  placeholder="Ex. Lomé (Tokoin), Cotonou..."
                  className="w-full touch-target rounded-xl border border-vita-border bg-white px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
                />
              </div>
            </div>

            {/* 5. Contact Vendeur (Téléphone / WhatsApp) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Numéro de téléphone joignable (Appel & WhatsApp) *</span>
              </label>
              <input
                type="tel"
                required
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full touch-target rounded-xl border border-vita-border bg-white px-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
              />
              <p className="text-[11px] text-vita-muted">
                Ce numéro s'affichera directement sur votre produit pour que les acheteurs puissent
                vous appeler ou vous contacter sur WhatsApp en 1 clic.
              </p>
            </div>

            {/* 6. Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-vita-deep uppercase tracking-wider">
                Description complète de l'article *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'état de l'article, ses fonctionnalités, les conditions de livraison ou le contenu du programme..."
                className="w-full rounded-2xl border border-vita-border bg-white p-3.5 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isPending || !quota.canPublish}
              className="w-full touch-target py-4 rounded-2xl bg-vita-deep hover:bg-vita-medium text-white font-extrabold text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-vita-bright" />
                  <span>Poster mon article</span>
                </>
              )}
            </button>

            <div className="p-3 rounded-2xl bg-vita-surface text-center text-xs text-vita-muted flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                Votre article sera examiné et validé sous 24h par l'administrateur avant sa parution
                sur le marché.
              </span>
            </div>
          </div>
        </form>
      )}

      {/* CONTENU ONGLET 2 : Mes Articles */}
      {activeTab === "my_products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-vita-deep">
              Mes Articles Postés ({myProducts.length})
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab("publish")}
              className="px-3 py-1.5 rounded-xl bg-vita-deep text-white text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ajouter un article</span>
            </button>
          </div>

          {myProducts.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-vita-border text-xs text-vita-muted space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-vita-muted/50" />
              <p className="font-semibold">Vous n'avez pas encore posté d'article sur Vita Earn.</p>
              <button
                type="button"
                onClick={() => setActiveTab("publish")}
                className="px-4 py-2 rounded-xl bg-vita-deep text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>Créer mon premier article</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-vita-border p-4 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-vita-surface h-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        {prod.status === "pending" && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <Clock className="w-3 h-3" />
                            <span>En attente de validation</span>
                          </span>
                        )}
                        {prod.status === "active" && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>En ligne (Validé)</span>
                          </span>
                        )}
                        {prod.status === "rejected" && (
                          <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <XCircle className="w-3 h-3" />
                            <span>Rejeté</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-vita-surface text-vita-deep">
                          {prod.productType === "physical"
                            ? "Physique"
                            : prod.productType === "service"
                            ? "Service"
                            : "Numérique"}
                        </span>
                        <span className="text-xs font-black text-emerald-700">
                          {formatFCFA(prod.price)}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-vita-deep text-sm line-clamp-1">
                        {prod.title}
                      </h3>
                      <p className="text-xs text-vita-muted line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-vita-border flex items-center justify-between text-[11px] text-vita-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {prod.sellerLocation}
                    </span>
                    <span>
                      {new Date(prod.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
