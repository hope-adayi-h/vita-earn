import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProductType = "physical" | "digital" | "service";
export type ProductStatus = "pending" | "active" | "rejected" | "archived";

export interface StoredProduct {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerPhone: string;
  sellerLocation: string;
  title: string;
  description: string;
  price: number; // en FCFA
  productType: ProductType;
  category: string;
  imageUrl: string; // 1 affiche / photo principale
  digitalLink?: string; // Lien direct de téléchargement ou d'accès (si produit numérique)
  status: ProductStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSettings {
  freeProductsLimit: number; // Par défaut : 2 articles gratuits
  extraProductPrice: number; // Prix par article supplémentaire en FCFA (ex: 1000 FCFA)
  totalExtraRevenue: number; // Somme totale collectée pour les articles supplémentaires
  updatedAt: string;
  updatedBy: string;
}

export interface UserMarketplaceQuota {
  totalPublished: number;
  activeCount: number;
  pendingCount: number;
  freeLimit: number;
  freeRemaining: number;
  extraSlotsPurchased: number;
  canPublish: boolean;
  extraRequired: boolean;
  extraPrice: number;
}

const DEFAULT_SETTINGS: MarketplaceSettings = {
  freeProductsLimit: 2,
  extraProductPrice: 1000,
  totalExtraRevenue: 0,
  updatedAt: "2026-11-20T00:00:00.000Z",
  updatedBy: "superadmin",
};

const SEED_PRODUCTS: StoredProduct[] = [];

function getProductsFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_products_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(localDir, "marketplace_products.json");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "marketplace_products.json");
  }
}

function getSettingsFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "marketplace_settings.json");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    return path.join(tmpDir, "marketplace_settings.json");
  }
}

/**
 * Récupère les paramètres actuels de la Marketplace
 */
export async function getMarketplaceSettings(): Promise<MarketplaceSettings> {
  // 1. Tenter depuis Supabase platform_settings
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "marketplace_settings")
        .maybeSingle();

      if (!error && data?.value) {
        const parsed = data.value as any;
        return {
          freeProductsLimit: Number(parsed.freeProductsLimit) || DEFAULT_SETTINGS.freeProductsLimit,
          extraProductPrice: Number(parsed.extraProductPrice) || DEFAULT_SETTINGS.extraProductPrice,
          totalExtraRevenue: Number(parsed.totalExtraRevenue) || DEFAULT_SETTINGS.totalExtraRevenue,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          updatedBy: parsed.updatedBy || "admin",
        };
      }
    }
  } catch {}

  // 2. Fichier local de secours
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(content) as MarketplaceSettings;
      return {
        freeProductsLimit: Number(parsed.freeProductsLimit) || DEFAULT_SETTINGS.freeProductsLimit,
        extraProductPrice: Number(parsed.extraProductPrice) || DEFAULT_SETTINGS.extraProductPrice,
        totalExtraRevenue: Number(parsed.totalExtraRevenue) || DEFAULT_SETTINGS.totalExtraRevenue,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        updatedBy: parsed.updatedBy || "admin",
      };
    }
  } catch {}

  return DEFAULT_SETTINGS;
}

/**
 * Sauvegarde les paramètres Marketplace définis par l'administrateur
 */
export async function saveMarketplaceSettings(
  input: {
    freeProductsLimit?: number;
    extraProductPrice?: number;
    totalExtraRevenue?: number;
  },
  adminIdentifier: string
): Promise<{ success: boolean; settings?: MarketplaceSettings; error?: string }> {
  try {
    const current = await getMarketplaceSettings();
    const updated: MarketplaceSettings = {
      freeProductsLimit:
        typeof input.freeProductsLimit === "number" && input.freeProductsLimit >= 0
          ? input.freeProductsLimit
          : current.freeProductsLimit,
      extraProductPrice:
        typeof input.extraProductPrice === "number" && input.extraProductPrice >= 0
          ? input.extraProductPrice
          : current.extraProductPrice,
      totalExtraRevenue:
        typeof input.totalExtraRevenue === "number" && input.totalExtraRevenue >= 0
          ? input.totalExtraRevenue
          : current.totalExtraRevenue,
      updatedAt: new Date().toISOString(),
      updatedBy: adminIdentifier,
    };

    const filePath = getSettingsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");

    // Sauvegarde Supabase platform_settings
    try {
      const isConfigured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

      if (isConfigured) {
        const adminClient = createAdminClient();
        await adminClient.from("platform_settings").upsert({
          key: "marketplace_settings",
          value: updated,
          description: "Quotas d'articles gratuits et tarification des articles supplémentaires",
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}

    return { success: true, settings: updated };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de sauvegarde.";
    return { success: false, error: msg };
  }
}

/**
 * Persiste la liste complète des produits (localement et dans Supabase platform_settings)
 */
async function persistProducts(products: StoredProduct[]): Promise<void> {
  // 1. Fichier local
  try {
    const filePath = getProductsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), "utf-8");
  } catch {}

  // 2. Supabase platform_settings (garantit le partage en temps réel entre toutes les instances Netlify)
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "marketplace_products",
        value: products,
        description: "Catalogue des produits, services et ressources digitales de la marketplace",
        updated_at: new Date().toISOString(),
      });
    }
  } catch {}
}

/**
 * Récupère tous les produits enregistrés
 */
export async function getAllStoredProducts(): Promise<StoredProduct[]> {
  // 1. Supabase platform_settings en priorité
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "marketplace_products")
        .maybeSingle();

      if (!error && Array.isArray(data?.value)) {
        return data.value as StoredProduct[];
      }
    }
  } catch {}

  // 2. Fichier local de secours
  try {
    const filePath = getProductsFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed as StoredProduct[];
      }
    }
  } catch {}

  // 3. Initialisation avec le catalogue de base
  try {
    await persistProducts(SEED_PRODUCTS);
  } catch {}

  return SEED_PRODUCTS;
}

/**
 * Récupère uniquement les produits actifs pour la place de marché publique
 */
export async function getActiveMarketplaceProducts(): Promise<StoredProduct[]> {
  const all = await getAllStoredProducts();
  return all.filter((p) => p.status === "active");
}

/**
 * Récupère un produit actif par son identifiant (pour la fiche publique partagée)
 */
export async function getStoredProductById(productId: string): Promise<StoredProduct | null> {
  if (!productId) return null;
  const all = await getAllStoredProducts();
  return all.find((p) => p.id === productId && p.status === "active") || null;
}

/**
 * Récupère les produits d'un utilisateur spécifique (vendeur)
 */
export async function getUserStoredProducts(userIdOrUsername: string): Promise<StoredProduct[]> {
  const all = await getAllStoredProducts();
  const clean = userIdOrUsername.trim().toLowerCase();
  return all.filter(
    (p) =>
      p.sellerId.toLowerCase() === clean ||
      p.sellerUsername.toLowerCase() === clean
  );
}

/**
 * Calcule le quota de publication de l'utilisateur
 */
export async function getUserMarketplaceQuota(
  userIdOrUsername: string
): Promise<UserMarketplaceQuota> {
  const settings = await getMarketplaceSettings();
  const userProducts = await getUserStoredProducts(userIdOrUsername);

  // Seuls les produits non archivés / non rejetés comptent dans le quota (pending ou active)
  const activeOrPending = userProducts.filter(
    (p) => p.status === "active" || p.status === "pending"
  );
  const totalCount = activeOrPending.length;
  const freeLimit = settings.freeProductsLimit;
  const freeRemaining = Math.max(0, freeLimit - totalCount);
  const canPublish = totalCount < freeLimit;

  return {
    totalPublished: totalCount,
    activeCount: userProducts.filter((p) => p.status === "active").length,
    pendingCount: userProducts.filter((p) => p.status === "pending").length,
    freeLimit,
    freeRemaining,
    extraSlotsPurchased: 0,
    canPublish,
    extraRequired: !canPublish,
    extraPrice: settings.extraProductPrice,
  };
}

/**
 * Ajoute un nouveau produit en attente de modération admin
 */
export async function createStoredProduct(
  data: Omit<StoredProduct, "id" | "status" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; product?: StoredProduct; error?: string }> {
  try {
    const products = await getAllStoredProducts();

    const newProduct: StoredProduct = {
      id: "prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      ...data,
      status: "pending", // Créé systématiquement en attente de validation admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    await persistProducts(products);

    return { success: true, product: newProduct };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la création du produit.";
    return { success: false, error: msg };
  }
}

/**
 * Modération d'un produit par l'administrateur (Valider, Rejeter, Archiver)
 */
export async function updateStoredProductStatus(
  productId: string,
  status: ProductStatus,
  rejectionReason?: string
): Promise<{ success: boolean; product?: StoredProduct; error?: string }> {
  try {
    const products = await getAllStoredProducts();
    const idx = products.findIndex((p) => p.id === productId);

    if (idx === -1) {
      return { success: false, error: "Produit introuvable." };
    }

    products[idx].status = status;
    products[idx].updatedAt = new Date().toISOString();
    if (rejectionReason) {
      products[idx].rejectionReason = rejectionReason;
    }

    await persistProducts(products);

    return { success: true, product: products[idx] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de modération.";
    return { success: false, error: msg };
  }
}

/**
 * Suppression d'un produit
 */
export async function deleteStoredProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const products = await getAllStoredProducts();
    const filtered = products.filter((p) => p.id !== productId);

    await persistProducts(filtered);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
    return { success: false, error: msg };
  }
}
