"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import type { StoredProduct, MarketplaceSettings } from "@/lib/data/products-store";
import { moderateProductAction, saveMarketplaceSettingsAction } from "@/app/admin/actions";
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Tag,
  AlertCircle,
  Filter,
  Search,
  Sliders,
  DollarSign,
  Package,
  Zap,
  Download,
  Phone,
  MapPin,
  ExternalLink,
  Clock,
  Sparkles,
  Save,
  X,
} from "lucide-react";

interface ProduitsClientProps {
  initialProducts: StoredProduct[];
  initialSettings: MarketplaceSettings;
}

export function ProduitsClient({ initialProducts, initialSettings }: ProduitsClientProps) {
  const [products, setProducts] = useState<StoredProduct[]>(initialProducts);
  const [settings, setSettings] = useState<MarketplaceSettings>(initialSettings);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Settings form state
  const [showSettings, setShowSettings] = useState(false);
  const [freeLimit, setFreeLimit] = useState(initialSettings.freeProductsLimit);
  const [extraPrice, setExtraPrice] = useState(initialSettings.extraProductPrice);
  const [extraRevenue, setExtraRevenue] = useState(initialSettings.totalExtraRevenue);

  // Large image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingCount = products.filter((p) => p.status === "pending").length;
  const activeCount = products.filter((p) => p.status === "active").length;
  const rejectedCount = products.filter((p) => p.status === "rejected").length;

  const filteredProducts = products.filter((p) => {
    if (filter === "pending" && p.status !== "pending") return false;
    if (filter === "active" && p.status !== "active") return false;
    if (filter === "rejected" && p.status !== "rejected") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.title.toLowerCase().includes(q) ||
        p.sellerUsername.toLowerCase().includes(q) ||
        p.sellerLocation.toLowerCase().includes(q) ||
        p.sellerPhone.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleModerate = (productId: string, status: "active" | "rejected" | "archived", notes?: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await moderateProductAction({ productId, status, notes });
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `Le produit a été ${status === "active" ? "approuvé et mis en ligne avec succès" : "rejeté"}.`,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status, rejectionReason: notes } : p))
        );
        setRejectingId(null);
        setRejectionReason("");
      }
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveMarketplaceSettingsAction({
        freeProductsLimit: Number(freeLimit) || 2,
        extraProductPrice: Number(extraPrice) || 1000,
        totalExtraRevenue: Number(extraRevenue) || 0,
      });

      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: "Les paramètres de la marketplace ont été enregistrés avec succès.",
        });
        setSettings({
          freeProductsLimit: Number(freeLimit) || 2,
          extraProductPrice: Number(extraPrice) || 1000,
          totalExtraRevenue: Number(extraRevenue) || 0,
          updatedAt: new Date().toISOString(),
          updatedBy: "admin",
        });
        setShowSettings(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au tableau de bord</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Modération & Réglages Marketplace
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Validation des articles (physiques, services, numériques) et configuration des quotas
            de vente
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="touch-target px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <Sliders className="w-4 h-4" />
          <span>{showSettings ? "Masquer les réglages" : "Configurer la marketplace"}</span>
        </button>
      </div>

      {/* Message d'état */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Panneau de Configuration Admin pour les Quotas & Tarifs */}
      {showSettings && (
        <form
          onSubmit={handleSaveSettings}
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131E17] border border-emerald-300 dark:border-emerald-800 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E2E24] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Paramètres de Quota et Tarification des Articles
              </h2>
            </div>
            <span className="text-[11px] text-gray-400">
              Modifié le {new Date(settings.updatedAt).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Articles Gratuits / Vendeur
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={freeLimit}
                onChange={(e) => setFreeLimit(Number(e.target.value))}
                className="w-full touch-target rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#0E1511] px-3.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white"
              />
              <p className="text-[10px] text-gray-400">
                Par défaut : 2 articles offerts à chaque compte activé.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Prix par Article Supplémentaire (FCFA)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                required
                value={extraPrice}
                onChange={(e) => setExtraPrice(Number(e.target.value))}
                className="w-full touch-target rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#0E1511] px-3.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white"
              />
              <p className="text-[10px] text-gray-400">
                Tarif appliqué au-delà du quota gratuit (ex: 1 000 FCFA).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Recettes Totales Collectées (FCFA)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={extraRevenue}
                onChange={(e) => setExtraRevenue(Number(e.target.value))}
                className="w-full touch-target rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#0E1511] px-3.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400"
              />
              <p className="text-[10px] text-gray-400">
                Somme totale enregistrée pour la publication d'articles supplémentaires.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#1E2E24]">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#1E2E24] text-xs font-bold text-gray-600 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer les paramètres</span>
            </button>
          </div>
        </form>
      )}

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>En attente</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>En ligne (Validés)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Rejetés</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {rejectedCount}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Recettes Extras</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
            {formatFCFA(settings.totalExtraRevenue)}
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, vendeur, ville..."
            className="w-full touch-target rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#131E17] pl-10 pr-4 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filter === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-600 dark:text-gray-300"
            }`}
          >
            En attente ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filter === "active"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-600 dark:text-gray-300"
            }`}
          >
            En ligne ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("rejected")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filter === "rejected"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-600 dark:text-gray-300"
            }`}
          >
            Rejetés ({rejectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filter === "all"
                ? "bg-gray-800 text-white shadow-xs"
                : "bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-600 dark:text-gray-300"
            }`}
          >
            Tous ({products.length})
          </button>
        </div>
      </div>

      {/* Liste des Produits pour Modération */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl text-xs text-gray-400 space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
            <p>Aucun produit ne correspond à ces critères.</p>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              {/* Photo du produit + Détails */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Photo / Affiche (1 seule photo) */}
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 dark:bg-black/30 overflow-hidden shrink-0 cursor-pointer border border-gray-200 dark:border-gray-800 relative group"
                  onClick={() => setPreviewImage(p.imageUrl)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                {/* Métadonnées */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base">
                      {p.title}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatFCFA(p.price)}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        p.productType === "digital"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : p.productType === "service"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      {p.productType === "digital"
                        ? "Numérique"
                        : p.productType === "service"
                        ? "Service"
                        : "Physique"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {p.description}
                  </p>

                  {/* Vendeur, Téléphone et Ville */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 flex-wrap pt-1">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {p.sellerUsername}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Phone className="w-3 h-3" />
                      {p.sellerPhone}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {p.sellerLocation}
                    </span>
                  </div>

                  {/* Si produit numérique : Lien direct pour contrôle admin */}
                  {p.productType === "digital" && p.digitalLink && (
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        Lien numérique :
                      </span>
                      <a
                        href={p.digitalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline max-w-xs truncate"
                      >
                        <span className="truncate">{p.digitalLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Raison de rejet si présent */}
                  {p.rejectionReason && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded-xl mt-1">
                      <strong>Motif de rejet :</strong> {p.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions de validation / rejet */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {p.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModerate(p.id, "active")}
                      disabled={isPending}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Mettre en ligne</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRejectingId(p.id)}
                      disabled={isPending}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rejeter</span>
                    </button>
                  </>
                )}

                {p.status === "active" && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      En Ligne
                    </span>
                    <button
                      type="button"
                      onClick={() => setRejectingId(p.id)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-red-600 text-xs font-bold"
                    >
                      Suspendre
                    </button>
                  </div>
                )}

                {p.status === "rejected" && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs font-bold border border-red-500/30">
                      Rejeté
                    </span>
                    <button
                      type="button"
                      onClick={() => handleModerate(p.id, "active")}
                      disabled={isPending}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-emerald-600 text-xs font-bold"
                    >
                      Ré-approuver
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Motif de Rejet */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-200 dark:border-[#1E2E24] max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Motif du rejet du produit
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Indiquez la raison pour laquelle cet article ne peut pas être publié (photo non
              conforme, lien erroné, prix fantaisiste, etc.).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex. L'affiche du produit est illisible ou le lien de téléchargement est inaccessible..."
              className="w-full rounded-2xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#0E1511] p-3 text-xs text-gray-900 dark:text-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#1E2E24] text-xs font-bold text-gray-600 dark:text-gray-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleModerate(rejectingId, "rejected", rejectionReason)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Affiche Plein Écran */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-transparent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Affiche en grand"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-white text-black rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
