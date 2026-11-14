"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  Package,
  Download,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  Phone,
  Store,
} from "lucide-react";

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  type: "physical" | "digital";
  category: string;
  sellerName: string;
  location: string;
  rating: number;
  reviewCount: number;
  stock?: number;
  deliveryEstimate?: string;
  features: string[];
}

const SAMPLE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "prod-1",
    title: "Pack Formation Vente WhatsApp & E-commerce 2026",
    description:
      "Guide complet étape par étape pour automatiser vos ventes sur WhatsApp Business et acquérir des clients au Togo et en Afrique de l'Ouest.",
    price: 4500,
    type: "digital",
    category: "digital",
    sellerName: "Digital Academy Lomé",
    location: "Lomé, Togo",
    rating: 4.9,
    reviewCount: 38,
    features: [
      "Téléchargement immédiat (PDF + Vidéos)",
      "Scripts de vente prêts à copier-coller",
      "Accès à vie aux mises à jour",
    ],
  },
  {
    id: "prod-2",
    title: "Montre Connectée Sport & Santé Pro étanche",
    description:
      "Suivi du rythme cardiaque, notifications WhatsApp et appels Bluetooth, autonomie 7 jours. Compatible Android et iPhone.",
    price: 16500,
    type: "physical",
    category: "tech",
    sellerName: "Tech Store Lomé",
    location: "Lomé (Tokoin)",
    rating: 4.8,
    reviewCount: 24,
    stock: 14,
    deliveryEstimate: "Livraison 24h à Lomé / 48h intérieur",
    features: ["Garantie 6 mois", "Câble de charge inclus", "Paiement à la livraison possible"],
  },
  {
    id: "prod-3",
    title: "150+ Templates Canva Pro pour Vendeurs Africains",
    description:
      "Visuels percutants pour vos publications Facebook, Instagram et statuts WhatsApp adaptés au marché francophone.",
    price: 3500,
    type: "digital",
    category: "digital",
    sellerName: "Studio Graphik Togo",
    location: "Lomé, Togo",
    rating: 5.0,
    reviewCount: 52,
    features: ["Lien d'accès Canva immédiat", "Modifiable gratuitement", "Format carré & Story"],
  },
  {
    id: "prod-4",
    title: "Écouteurs Sans Fil TWS Bluetooth 5.3 Stéréo",
    description:
      "Son puissant haute fidélité, réduction de bruit passive, boîte de charge avec affichage LED numérique.",
    price: 8500,
    type: "physical",
    category: "tech",
    sellerName: "Afrik Électro",
    location: "Lomé (Assivito)",
    rating: 4.7,
    reviewCount: 19,
    stock: 22,
    deliveryEstimate: "Livraison express Lomé le jour même",
    features: ["Autonomie 20h avec boîtier", "Micro intégré pour appels", "Testé avant expédition"],
  },
  {
    id: "prod-5",
    title: "Guide Pratique : Créer et Formaliser son Entreprise au Togo",
    description:
      "Toutes les démarches CFE, fiscalité OTR, ouverture de compte bancaire et conseils juridiques rédigés par des experts.",
    price: 5000,
    type: "digital",
    category: "digital",
    sellerName: "Jurik Conseils Lomé",
    location: "Lomé, Togo",
    rating: 4.9,
    reviewCount: 15,
    features: ["Modèles de statuts SARL/EURL", "Tableau récapitulatif fiscalité", "Support par email"],
  },
  {
    id: "prod-6",
    title: "Tissu Pagne Wax Traditionnel Supérieur (6 Yards)",
    description:
      "Véritable tissu wax haute qualité, 100% coton, couleurs vives inaltérables. Idéal pour cérémonies et confections de prestige.",
    price: 14000,
    type: "physical",
    category: "mode",
    sellerName: "Nana Wax Prestige",
    location: "Grand Marché de Lomé",
    rating: 4.9,
    reviewCount: 31,
    stock: 9,
    deliveryEstimate: "Expédition dans tout le Togo & pays UEMOA",
    features: ["100% Coton peigné", "Longueur 6 yards (5,48 m)", "Qualité garantie grand teint"],
  },
];

export function MarketplaceClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "physical" | "digital">("all");
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"tmoney" | "flooz" | "card">("tmoney");
  const [isOrdering, setIsOrdering] = useState(false);

  // Filtrage des articles
  const filteredProducts = useMemo(() => {
    return SAMPLE_PRODUCTS.filter((prod) => {
      const matchesSearch =
        prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "physical" && prod.type === "physical") ||
        (selectedCategory === "digital" && prod.type === "digital");

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSimulateOrder = () => {
    setIsOrdering(true);
    setTimeout(() => {
      setIsOrdering(false);
      setOrderSuccess(true);
    }, 1200);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setOrderSuccess(false);
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Bannière Mode Acheteur vs Vendeur */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-vita-deep rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Espace Acheteur Ouvert</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Place de Marché Vita Earn
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Commandez des produits physiques livrables chez vous ou téléchargez des ressources
              digitales instantanées au Togo et dans la sous-région.
            </p>
          </div>

          {/* Appel à l'action pour les vendeurs */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
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
              className="touch-target px-4 py-2 rounded-xl bg-vita-bright text-vita-deep font-extrabold text-xs shadow-md hover:bg-white transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Activer Vendeur</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de recherche et Filtres par type */}
      <div className="bg-white rounded-2xl border border-vita-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Recherche */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit, une formation, une boutique..."
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

        {/* Filtres par type */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-vita-deep text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            Tous ({SAMPLE_PRODUCTS.length})
          </button>
          <button
            onClick={() => setSelectedCategory("physical")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === "physical"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Produits physiques</span>
          </button>
          <button
            onClick={() => setSelectedCategory("digital")}
            className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === "digital"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-vita-surface text-vita-muted hover:text-vita-text"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Produits digitaux</span>
          </button>
        </div>
      </div>

      {/* Grille des articles */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-vita-border p-12 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-vita-muted mx-auto mb-3" />
          <h3 className="text-base font-bold text-vita-text">Aucun article trouvé</h3>
          <p className="text-xs text-vita-muted mt-1">
            Essayez de modifier vos termes de recherche ou de sélectionner une autre catégorie.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-vita-surface text-vita-deep text-xs font-semibold hover:bg-vita-border transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-vita-border/90 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div className="p-5 sm:p-6 space-y-3">
                {/* Badges d'en-tête */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      product.type === "digital"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {product.type === "digital" ? (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Digital</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-3 h-3" />
                        <span>Physique</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating.toFixed(1)}</span>
                    <span className="text-vita-muted font-normal">({product.reviewCount})</span>
                  </div>
                </div>

                {/* Titre */}
                <h3 className="font-extrabold text-sm sm:text-base text-vita-text leading-snug group-hover:text-vita-deep transition-colors line-clamp-2">
                  {product.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-vita-muted leading-relaxed line-clamp-2">
                  {product.description}
                </p>

                {/* Boutique vendeuse */}
                <div className="flex items-center gap-1.5 text-[11px] text-vita-muted pt-1">
                  <Store className="w-3.5 h-3.5 text-vita-medium" />
                  <span className="font-semibold text-vita-text">{product.sellerName}</span>
                  <span>•</span>
                  <span>{product.location}</span>
                </div>
              </div>

              {/* Pied de carte avec Prix & Bouton Commander */}
              <div className="p-5 sm:p-6 pt-0 border-t border-vita-border/40 mt-2 bg-vita-surface/30 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-vita-muted">
                    Prix officiel
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-vita-deep">
                    {formatFCFA(product.price)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="touch-target px-4 py-2 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 group-hover:scale-105 duration-200"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Acheter</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'Achat / Commande Acheteur */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-vita-border max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-vita-muted hover:text-vita-text rounded-full hover:bg-vita-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderSuccess ? (
              <div className="space-y-5">
                {/* En-tête produit */}
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShoppingBag className="w-3 h-3" />
                    <span>Commande Acheteur</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-vita-deep">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-xs text-vita-muted mt-1">{selectedProduct.description}</p>
                </div>

                {/* Caractéristiques */}
                <div className="p-3.5 rounded-xl bg-vita-surface border border-vita-border/80 space-y-2">
                  <span className="block text-xs font-bold text-vita-text">
                    Détails de la commande :
                  </span>
                  <ul className="text-xs text-vita-muted space-y-1">
                    {selectedProduct.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-vita-medium flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Montant total */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-green-50/80 border border-green-200 text-green-950">
                  <span className="text-xs font-bold">Total à payer :</span>
                  <span className="text-xl font-black text-vita-deep">
                    {formatFCFA(selectedProduct.price)}
                  </span>
                </div>

                {/* Choix du mode de règlement */}
                <div>
                  <span className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-2">
                    Moyen de paiement Mobile Money :
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("tmoney")}
                      className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                        paymentMethod === "tmoney"
                          ? "border-vita-deep bg-green-50 ring-1 ring-vita-deep text-vita-deep"
                          : "border-vita-border bg-white text-vita-muted"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                      T-Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("flooz")}
                      className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                        paymentMethod === "flooz"
                          ? "border-vita-deep bg-green-50 ring-1 ring-vita-deep text-vita-deep"
                          : "border-vita-border bg-white text-vita-muted"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
                      Moov Flooz
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                        paymentMethod === "card"
                          ? "border-vita-deep bg-green-50 ring-1 ring-vita-deep text-vita-deep"
                          : "border-vita-border bg-white text-vita-muted"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 mx-auto mb-1 text-gray-600" />
                      Carte
                    </button>
                  </div>
                </div>

                {/* Bouton de confirmation */}
                <button
                  type="button"
                  onClick={handleSimulateOrder}
                  disabled={isOrdering}
                  className="w-full touch-target rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isOrdering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validation du paiement Mobile Money...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-vita-bright" />
                      <span>Confirmer l'achat ({formatFCFA(selectedProduct.price)})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-vita-bright flex items-center justify-center mx-auto text-vita-deep">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-extrabold text-vita-deep">
                  Commande validée avec succès !
                </h3>
                <p className="text-xs sm:text-sm text-vita-muted max-w-sm mx-auto">
                  {selectedProduct.type === "digital"
                    ? "Votre ressource digitale est disponible en téléchargement immédiat. Un lien de sauvegarde a également été envoyé par e-mail."
                    : "Votre commande physique a été transmise au vendeur. Vous recevrez une confirmation par SMS / WhatsApp pour la livraison."}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  {selectedProduct.type === "digital" && (
                    <button
                      type="button"
                      onClick={() => alert("Simulation : Fichier sécurisé téléchargé avec succès !")}
                      className="touch-target px-4 py-2.5 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-vita-bright" />
                      <span>Télécharger mon produit digital</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="touch-target px-4 py-2 rounded-xl bg-vita-surface hover:bg-vita-border text-vita-text font-semibold text-xs transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
