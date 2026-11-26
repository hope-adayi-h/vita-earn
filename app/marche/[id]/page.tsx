import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Store,
  Download,
  ExternalLink,
  ShieldCheck,
  Package,
  Zap,
} from "lucide-react";
import { getStoredProductById } from "@/lib/data/products-store";
import { formatFCFA } from "@/lib/utils";
import { WhatsAppLogo } from "@/components/WhatsAppLogo";
import { ProductShareActions } from "./ProductShareActions";

export const dynamic = "force-dynamic";

function getBaseUrlFromHeaders(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "vita-earn.netlify.app";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getStoredProductById(params.id);
  if (!product) {
    return {
      title: "Produit introuvable — Vita Earn",
    };
  }

  const baseUrl = getBaseUrlFromHeaders();
  const productUrl = `${baseUrl}/marche/${product.id}`;
  const ogImageUrl = `${baseUrl}/api/marche/image/${product.id}`;
  const titleWithPrice = `${product.title} — ${formatFCFA(product.price)}`;
  const shortDesc =
    product.description.length > 155
      ? `${product.description.slice(0, 152)}...`
      : product.description;

  return {
    title: `${titleWithPrice} | Place de Marché Vita Earn`,
    description: shortDesc,
    openGraph: {
      title: titleWithPrice,
      description: shortDesc,
      url: productUrl,
      siteName: "Vita Earn",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithPrice,
      description: shortDesc,
      images: [ogImageUrl],
    },
  };
}

export default async function ProductPublicPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getStoredProductById(params.id);
  if (!product) {
    notFound();
  }

  const cleanPhoneForWhatsApp = (rawPhone: string) => rawPhone.replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-4">
      <div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/marche"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4D0F] hover:underline min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voir toute la Place de Marché</span>
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/25 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vérifié Vita Earn</span>
          </span>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Image du produit */}
          <div className="relative h-64 sm:h-80 bg-slate-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase shadow-sm ${
                  product.productType === "digital"
                    ? "bg-blue-600 text-white"
                    : product.productType === "service"
                    ? "bg-amber-600 text-white"
                    : "bg-[#1B4D0F] text-white"
                }`}
              >
                {product.productType === "digital" ? (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Produit Numérique</span>
                  </>
                ) : product.productType === "service" ? (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Service</span>
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5" />
                    <span>Produit Physique</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Détails et commande */}
          <div className="p-5 sm:p-7 space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#14201A] leading-snug">
                {product.title}
              </h1>
              <div className="text-2xl font-black text-[#2F7A1A] mt-1">
                {formatFCFA(product.price)}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#14201A] uppercase tracking-wider">
                Description :
              </span>
              <p className="text-xs sm:text-sm text-[#5B6B60] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {product.productType === "digital" && product.digitalLink && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>Accès / Téléchargement</span>
                </span>
                <a
                  href={product.digitalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Télécharger / Accéder</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Informations Vendeur & Boutons Commande directe sans compte requis */}
            <div className="p-4 rounded-2xl bg-[#F4F7F0] border border-[#1B4D0F]/15 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5B6B60] flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-[#2F7A1A]" />
                  Vendeur :
                </span>
                <span className="font-bold text-[#14201A]">{product.sellerUsername}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5B6B60] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2F7A1A]" />
                  Localisation :
                </span>
                <span className="font-bold text-[#14201A]">{product.sellerLocation}</span>
              </div>
              {product.sellerPhone && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5B6B60]">Contact :</span>
                  <span className="font-bold text-[#2F7A1A]">{product.sellerPhone}</span>
                </div>
              )}

              {product.sellerPhone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp(
                      product.sellerPhone
                    )}?text=${encodeURIComponent(
                      `Bonjour ${product.sellerUsername}, je souhaite commander votre article "${product.title}" (${formatFCFA(product.price)}) vu sur Vita Earn.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <WhatsAppLogo className="w-4 h-4" />
                    <span>Commander sur WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${product.sellerPhone}`}
                    className="min-h-[44px] py-2.5 px-4 rounded-xl bg-[#1B4D0F] hover:bg-[#2F7A1A] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Phone className="w-4 h-4 text-[#7ED321]" />
                    <span>Appeler le vendeur</span>
                  </a>
                </div>
              )}
            </div>

            {/* Partage WhatsApp Status */}
            <ProductShareActions productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
