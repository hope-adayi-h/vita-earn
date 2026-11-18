"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { moderateProductAction } from "@/app/admin/actions";

export interface ProductAdminItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: "pending" | "active" | "rejected" | "archived";
  sellerName: string;
  isDigital: boolean;
  createdAt: string;
}

interface ProduitsClientProps {
  initialProducts: ProductAdminItem[];
}

export function ProduitsClient({ initialProducts }: ProduitsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "rejected">("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredProducts = products.filter((p) => {
    if (filter === "pending") return p.status === "pending";
    if (filter === "active") return p.status === "active";
    if (filter === "rejected") return p.status === "rejected";
    return true;
  });

  const handleModerate = (productId: string, status: "active" | "rejected" | "archived") => {
    setMessage(null);
    startTransition(async () => {
      const res = await moderateProductAction({ productId, status });
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `Le produit a été ${status === "active" ? "approuvé et mis en ligne" : "rejeté"}.`,
        });
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status } : p))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au tableau de bord</span>
        </Link>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Modération des Produits (Marketplace)
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Validation des articles physiques et digitaux avant parution sur le marché
        </p>
      </div>

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

      {/* Filtres de modération */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === "all"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-600 dark:text-gray-300"
          }`}
        >
          Tous ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === "pending"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-600 dark:text-gray-300"
          }`}
        >
          En attente ({products.filter((p) => p.status === "pending").length})
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
          Approuvés ({products.filter((p) => p.status === "active").length})
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
          Rejetés ({products.filter((p) => p.status === "rejected").length})
        </button>
      </div>

      {/* Grille / Liste des articles */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl text-xs text-gray-400">
            Aucun produit dans cette catégorie.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {p.title}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {formatFCFA(p.price)}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-emerald-950/40 text-gray-600 dark:text-gray-300">
                      {p.category}
                    </span>
                    {p.isDigital && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                        Digital
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {p.description}
                  </p>

                  <div className="text-[11px] text-gray-400">
                    Vendeur : <span className="font-semibold text-gray-700 dark:text-gray-300">{p.sellerName}</span>
                  </div>
                </div>
              </div>

              {/* Actions de modération */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {p.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModerate(p.id, "active")}
                      disabled={isPending}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approuver</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerate(p.id, "rejected")}
                      disabled={isPending}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejeter</span>
                    </button>
                  </>
                )}

                {p.status === "active" && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    En Ligne
                  </span>
                )}

                {p.status === "rejected" && (
                  <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs font-bold border border-red-500/30">
                    Refusé
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
