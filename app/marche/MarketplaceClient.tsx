"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import type { StoredProduct } from "@/lib/data/products-store";
import {
  ShoppingBag,
  Search,
  Package,
  Zap,
  Download,
  CheckCircle2,
  Phone,
  MapPin,
  ExternalLink,
  PlusCircle,
  X,
  Store,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppLogo } from "@/components/WhatsAppLogo";
import { ProductShareActions } from "./[id]/ProductShareActions";

interface MarketplaceClientProps {
  initialProducts: StoredProduct[];
  isActivated: boolean;
}

export function MarketplaceClient({ initialProducts, isActivated }: MarketplaceClientProps) {
  const [products] = useState<StoredProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "physical" | "service" | "digital">("all");
  const [selectedProduct, setSelectedProduct] = useState<StoredProduct | null>(null);

  // Filtrage dynamique
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.title.toLowerCase().includes(q) ||
        prod.description.toLowerCase().includes(q) ||
        prod.sellerUsername.toLowerCase().includes(q) ||
        prod.sellerLocation.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);

      const matchesType =
        selectedType === "all" || prod.productType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [products, searchQuery, selectedType]);

  const cleanPhoneForWhatsApp = (rawPhone: string) => {
    return rawPhone.replace(/[^0-9]/g, "");
  };

  return (
    <div className="space-y-6 pt-2 pb-16 px-4 max-w-7xl mx-auto">
      {/* Bannière Dynamique : Vendeur Activé vs Non-Activé */}
      <div className="bg-gradient-to-r from-vita-deep via-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Place de Marché Vita Earn</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Achetez et Vendez en Toute Confiance
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Découvrez des produits physiques de qualité, des prestations de services et des
              formations & ressources numériques certifiées au Togo et dans la sous-région.
            </p>
          </div>

          {/* Section d'action Vendeur selon statut d'activation */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {isActivated ? (
              <>
                <div className="text-left sm:text-right">
                  <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Compte Vendeur Activé</span>
                  </div>
                  <span className="text-xs sm:text-sm text-white/90">
                    Vous avez des articles à vendre ?
                  </span>
                </div>
                <Link
                  href="/vendre"
                  className="touch-target px-5 py-2.5 rounded-xl bg-vita-bright hover:bg-white text-vita-deep font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publier un article</span>
                </Link>
              </>
            ) : (
              <>
                <div className="text-left sm:text-right">
                  <span className="block text-xs font-semibold text-emerald-200">
                    Vous voulez vendre vos produits ?
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    Activez votre compte pour 4 500 FCFA
                  </span>
                </div>
                <Link
                  href="/activation"
                  className="touch-target px-5 py-2.5 rounded-xl bg-vita-bright hover:bg-white text-vita-deep font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>Activer Vendeur</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres par Type */}
      <div className="bg-white rounded-2xl border border-vita-border p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Recherche */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit, un service, un vendeur..."
            className="w-full touch-target rounded-xl border border-vita-border bg-vita-surface/40 pl-10 pr-4 text-xs sm:text-sm text-vita-text focus:outline-none focus:ring-2 focus:ring-vita-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vita-muted hover:text-vita-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres par Type de Produit */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedType("all")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedType === "all"
                ? "bg-vita-deep text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setSelectedType("physical")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedType === "physical"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Physiques</span>
          </button>
          <button
            onClick={() => setSelectedType("service")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedType === "service"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Services</span>
          </button>
          <button
            onClick={() => setSelectedType("digital")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedType === "digital"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Numériques</span>
          </button>
        </div>
      </div>

      {/* Grille des Produits du Marché */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-vita-border p-12 text-center shadow-sm space-y-3">
          <ShoppingBag className="w-12 h-12 text-vita-muted mx-auto" />
          <h3 className="text-base font-bold text-vita-text">Aucun article trouvé</h3>
          <p className="text-xs text-vita-muted max-w-sm mx-auto">
            Aucun produit ne correspond à votre recherche. Modifiez vos critères ou soyez le premier
            à publier dans cette catégorie !
          </p>
          {isActivated && (
            <Link
              href="/vendre"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vita-deep text-white text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier un article maintenant</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-vita-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Photo principale / Affiche (1 seule photo) */}
              <div
                className="relative h-48 bg-vita-surface overflow-hidden cursor-pointer"
                onClick={() => setSelectedProduct(prod)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.imageUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Type */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      prod.productType === "digital"
                        ? "bg-blue-600 text-white"
                        : prod.productType === "service"
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-700 text-white"
                    }`}
                  >
                    {prod.productType === "digital" ? (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Numérique</span>
                      </>
                    ) : prod.productType === "service" ? (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Service</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-3 h-3" />
                        <span>Physique</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Badge Certifié */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Vérifié</span>
                  </span>
                </div>
              </div>

              {/* Corps du produit */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={() => setSelectedProduct(prod)}
                      className="font-extrabold text-sm sm:text-base text-vita-deep leading-snug line-clamp-2 cursor-pointer hover:text-emerald-700"
                    >
                      {prod.title}
                    </h3>
                  </div>

                  <p className="text-xs text-vita-muted line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Vendeur et Ville (uniquement si compte activé) */}
                  {isActivated && (
                    <div className="pt-2 text-[11px] text-vita-muted flex items-center justify-between border-t border-vita-border/60">
                      <span className="flex items-center gap-1 font-semibold text-vita-text">
                        <Store className="w-3 h-3 text-emerald-700" />
                        {prod.sellerUsername}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-vita-muted" />
                        {prod.sellerLocation}
                      </span>
                    </div>
                  )}
                </div>

                {/* Prix et Contact Vendeur Direct */}
                <div className="pt-3 border-t border-vita-border/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-vita-muted">
                      Prix
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-700">
                      {formatFCFA(prod.price)}
                    </span>
                  </div>

                  {/* Boutons d'interaction */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isActivated && <ProductShareActions productId={prod.id} compact />}
                    {isActivated && prod.sellerPhone && (
                      <>
                        <a
                          href={`https://wa.me/${cleanPhoneForWhatsApp(
                            prod.sellerPhone
                          )}?text=${encodeURIComponent(
                            `Bonjour, je suis intéressé par votre article "${prod.title}" vu sur la place de marché Vita Earn.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="touch-target px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                          title="Contacter sur WhatsApp"
                        >
                          <WhatsAppLogo className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${prod.sellerPhone}`}
                          className="touch-target px-2.5 py-1.5 rounded-xl bg-vita-surface hover:bg-vita-border text-vita-deep text-xs font-bold transition-all flex items-center gap-1"
                          title="Appeler le vendeur"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="hidden sm:inline">Appeler</span>
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedProduct(prod)}
                      className="touch-target px-3 py-1.5 rounded-xl bg-vita-deep hover:bg-vita-medium text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Fiche Produit Complète */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-vita-border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 text-vita-muted hover:text-vita-text rounded-full hover:bg-vita-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              {/* Image d'affiche */}
              <div className="relative rounded-2xl overflow-hidden bg-vita-surface h-56 sm:h-64">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-vita-deep/90 backdrop-blur text-white text-xs font-extrabold uppercase">
                    {selectedProduct.productType === "digital"
                      ? "Produit Numérique"
                      : selectedProduct.productType === "service"
                      ? "Service"
                      : "Produit Physique"}
                  </span>
                </div>
              </div>

              {/* Titre & Prix */}
              <div>
                <h2 className="text-xl font-black text-vita-deep leading-snug">
                  {selectedProduct.title}
                </h2>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {formatFCFA(selectedProduct.price)}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-vita-deep uppercase tracking-wider">
                  Description du produit :
                </span>
                <p className="text-xs sm:text-sm text-vita-muted leading-relaxed whitespace-pre-line">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Si produit numérique avec lien direct */}
              {selectedProduct.productType === "digital" && selectedProduct.digitalLink && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <span className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-700" />
                    <span>Lien d'accès ou de téléchargement direct</span>
                  </span>
                  <a
                    href={selectedProduct.digitalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Télécharger / Accéder au fichier</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[11px] text-blue-800">
                    Ce lien a été certifié par l'équipe administrative de Vita Earn.
                  </p>
                </div>
              )}

              {/* Informations Vendeur et Contact Direct (réservés aux comptes activés) */}
              {isActivated ? (
                <div className="p-4 rounded-2xl bg-vita-surface border border-vita-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vita-muted">Vendeur :</span>
                    <span className="font-bold text-vita-deep">{selectedProduct.sellerUsername}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vita-muted">Localisation :</span>
                    <span className="font-bold text-vita-deep">{selectedProduct.sellerLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vita-muted">Numéro de contact :</span>
                    <span className="font-bold text-emerald-700">{selectedProduct.sellerPhone}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(
                        selectedProduct.sellerPhone
                      )}?text=${encodeURIComponent(
                        `Bonjour ${selectedProduct.sellerUsername}, je suis intéressé par votre article "${selectedProduct.title}" vu sur la place de marché Vita Earn.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="touch-target py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <WhatsAppLogo className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${selectedProduct.sellerPhone}`}
                      className="touch-target py-2.5 px-3 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Appeler</span>
                    </a>
                  </div>

                  <ProductShareActions productId={selectedProduct.id} />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-950">
                  <p className="font-bold">
                    Pour commander cet article, contactez directement la personne qui a partagé ce lien.
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Les coordonnées directes du vendeur et le lien de partage sont réservés aux membres Vita Earn ayant activé leur compte.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
