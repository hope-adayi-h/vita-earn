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
  freeProductsLimit: number; // Par défaut : 1 article gratuit
  extraProductPrice: number; // Prix par article supplémentaire en FCFA (ex: 1000 FCFA)
  totalExtraRevenue: number; // Somme totale collectée pour les articles supplémentaires
  adminWhatsappNumber: string; // Numéro WhatsApp administrateur pour paiement manuel du quota
  updatedAt: string;
  updatedBy: string;
}

export interface UserMarketplaceQuota {
  totalPublished: number;
  activeCount: number;
  pendingCount: number;
  freeLimit: number;
  totalLimit: number;
  freeRemaining: number;
  extraSlotsPurchased: number;
  isUnlimited: boolean;
  canPublish: boolean;
  extraRequired: boolean;
  extraPrice: number;
}

export interface SellerQuotaGrant {
  sellerKey: string;
  sellerId: string;
  sellerUsername: string;
  sellerPhone: string;
  extraSlotsGranted: number;
  isUnlimited: boolean;
  dismissed?: boolean;
  updatedAt: string;
  grantedBy: string;
}

export interface SellerQuotaSummary {
  sellerKey: string;
  sellerId: string;
  sellerUsername: string;
  sellerPhone: string;
  publishedCount: number;
  baseFreeLimit: number;
  extraSlotsGranted: number;
  totalLimit: number;
  isUnlimited: boolean;
  isBlocked: boolean;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: MarketplaceSettings = {
  freeProductsLimit: 1,
  extraProductPrice: 1000,
  totalExtraRevenue: 0,
  adminWhatsappNumber: "",
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
    const testFile = path.join(localDir, ".test_settings_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(localDir, "marketplace_settings.json");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "marketplace_settings.json");
  }
}

function getSellerQuotasFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_quotas_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(localDir, "marketplace_seller_quotas.json");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "marketplace_seller_quotas.json");
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
        const parsed = data.value as Record<string, unknown>;
        return {
          freeProductsLimit:
            typeof parsed.freeProductsLimit === "number" && parsed.freeProductsLimit >= 0
              ? parsed.freeProductsLimit
              : Number(parsed.freeProductsLimit) || DEFAULT_SETTINGS.freeProductsLimit,
          extraProductPrice:
            typeof parsed.extraProductPrice === "number" && parsed.extraProductPrice >= 0
              ? parsed.extraProductPrice
              : Number(parsed.extraProductPrice) || DEFAULT_SETTINGS.extraProductPrice,
          totalExtraRevenue: Number(parsed.totalExtraRevenue) || DEFAULT_SETTINGS.totalExtraRevenue,
          adminWhatsappNumber: String(parsed.adminWhatsappNumber || ""),
          updatedAt: String(parsed.updatedAt || new Date().toISOString()),
          updatedBy: String(parsed.updatedBy || "admin"),
        };
      }
    }
  } catch {}

  // 2. Fichier local de secours
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(content) as Partial<MarketplaceSettings>;
      return {
        freeProductsLimit:
          typeof parsed.freeProductsLimit === "number" && parsed.freeProductsLimit >= 0
            ? parsed.freeProductsLimit
            : Number(parsed.freeProductsLimit) || DEFAULT_SETTINGS.freeProductsLimit,
        extraProductPrice:
          typeof parsed.extraProductPrice === "number" && parsed.extraProductPrice >= 0
            ? parsed.extraProductPrice
            : Number(parsed.extraProductPrice) || DEFAULT_SETTINGS.extraProductPrice,
        totalExtraRevenue: Number(parsed.totalExtraRevenue) || DEFAULT_SETTINGS.totalExtraRevenue,
        adminWhatsappNumber: String(parsed.adminWhatsappNumber || ""),
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
    adminWhatsappNumber?: string;
  },
  adminIdentifier: string
): Promise<{ success: boolean; settings?: MarketplaceSettings; error?: string }> {
  try {
    const current = await getMarketplaceSettings();
    const updated: MarketplaceSettings = {
      freeProductsLimit:
        typeof input.freeProductsLimit === "number" && !isNaN(input.freeProductsLimit) && input.freeProductsLimit >= 0
          ? input.freeProductsLimit
          : current.freeProductsLimit,
      extraProductPrice:
        typeof input.extraProductPrice === "number" && !isNaN(input.extraProductPrice) && input.extraProductPrice >= 0
          ? input.extraProductPrice
          : current.extraProductPrice,
      totalExtraRevenue:
        typeof input.totalExtraRevenue === "number" && !isNaN(input.totalExtraRevenue) && input.totalExtraRevenue >= 0
          ? input.totalExtraRevenue
          : current.totalExtraRevenue,
      adminWhatsappNumber:
        typeof input.adminWhatsappNumber === "string"
          ? input.adminWhatsappNumber.trim()
          : current.adminWhatsappNumber,
      updatedAt: new Date().toISOString(),
      updatedBy: adminIdentifier,
    };

    // Écriture locale tolérante (ne bloque jamais en environnement serverless lecture seule)
    try {
      const filePath = getSettingsFilePath();
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
    } catch {}

    // Sauvegarde Supabase platform_settings
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { error } = await adminClient.from("platform_settings").upsert({
        key: "marketplace_settings",
        value: updated,
        description: "Quotas d'articles gratuits, WhatsApp admin et tarification des articles supplémentaires",
        updated_at: new Date().toISOString(),
      });
      if (error) {
        return { success: false, error: `Erreur Supabase : ${error.message}` };
      }
    }

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
 * Récupère toutes les autorisations de quota supplémentaires accordées par l'admin
 */
export async function getAllSellerQuotaGrants(): Promise<SellerQuotaGrant[]> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "marketplace_seller_quotas")
        .maybeSingle();

      if (!error && Array.isArray(data?.value)) {
        return data.value as SellerQuotaGrant[];
      }
    }
  } catch {}

  try {
    const filePath = getSellerQuotasFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""));
      if (Array.isArray(parsed)) return parsed as SellerQuotaGrant[];
    }
  } catch {}

  return [];
}

async function persistSellerQuotaGrants(grants: SellerQuotaGrant[]): Promise<void> {
  try {
    fs.writeFileSync(getSellerQuotasFilePath(), JSON.stringify(grants, null, 2), "utf-8");
  } catch {}

  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "marketplace_seller_quotas",
        value: grants,
        description: "Quotas supplémentaires accordés aux vendeurs après paiement manuel",
        updated_at: new Date().toISOString(),
      });
    }
  } catch {}
}

/**
 * Calcule le quota de publication de l'utilisateur (incluant les slots accordés par l'admin)
 */
export async function getUserMarketplaceQuota(
  userIdOrUsername: string
): Promise<UserMarketplaceQuota> {
  const [settings, userProducts, grants] = await Promise.all([
    getMarketplaceSettings(),
    getUserStoredProducts(userIdOrUsername),
    getAllSellerQuotaGrants(),
  ]);

  // Seuls les produits non archivés / non rejetés comptent dans le quota (pending ou active)
  const activeOrPending = userProducts.filter(
    (p) => p.status === "active" || p.status === "pending"
  );
  const totalCount = activeOrPending.length;
  const freeLimit = settings.freeProductsLimit;

  const clean = userIdOrUsername.trim().toLowerCase();
  const grant = grants.find(
    (g) =>
      g.sellerKey.toLowerCase() === clean ||
      g.sellerId.toLowerCase() === clean ||
      g.sellerUsername.toLowerCase() === clean
  );

  const isUnlimited = Boolean(grant?.isUnlimited);
  const extraSlotsPurchased = grant?.extraSlotsGranted || 0;
  const totalLimit = isUnlimited ? 999999 : freeLimit + extraSlotsPurchased;
  const freeRemaining = isUnlimited ? 999 : Math.max(0, totalLimit - totalCount);
  const canPublish = isUnlimited || totalCount < totalLimit;

  return {
    totalPublished: totalCount,
    activeCount: userProducts.filter((p) => p.status === "active").length,
    pendingCount: userProducts.filter((p) => p.status === "pending").length,
    freeLimit,
    totalLimit,
    freeRemaining,
    extraSlotsPurchased,
    isUnlimited,
    canPublish,
    extraRequired: !canPublish,
    extraPrice: settings.extraProductPrice,
  };
}

/**
 * Liste tous les vendeurs ayant atteint le quota gratuit ou disposant d'une autorisation admin
 */
export async function getSellersAtQuotaSummary(): Promise<SellerQuotaSummary[]> {
  const [settings, allProducts, grants] = await Promise.all([
    getMarketplaceSettings(),
    getAllStoredProducts(),
    getAllSellerQuotaGrants(),
  ]);

  const bySeller = new Map<
    string,
    { sellerId: string; sellerUsername: string; sellerPhone: string; count: number }
  >();

  for (const prod of allProducts) {
    if (prod.status !== "active" && prod.status !== "pending") continue;
    const key = (prod.sellerUsername || prod.sellerId).trim().toLowerCase();
    const existing = bySeller.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.sellerPhone && prod.sellerPhone) existing.sellerPhone = prod.sellerPhone;
    } else {
      bySeller.set(key, {
        sellerId: prod.sellerId,
        sellerUsername: prod.sellerUsername,
        sellerPhone: prod.sellerPhone,
        count: 1,
      });
    }
  }

  const summaries: SellerQuotaSummary[] = [];

  for (const [key, info] of Array.from(bySeller.entries())) {
    const grant = grants.find(
      (g) =>
        g.sellerKey.toLowerCase() === key ||
        g.sellerId.toLowerCase() === info.sellerId.toLowerCase() ||
        g.sellerUsername.toLowerCase() === info.sellerUsername.toLowerCase()
    );

    if (grant?.dismissed && info.count <= settings.freeProductsLimit && grant.extraSlotsGranted === 0 && !grant.isUnlimited) {
      continue;
    }

    const hasReachedBase = info.count >= settings.freeProductsLimit;
    if (!hasReachedBase && !grant) continue;

    const isUnlimited = Boolean(grant?.isUnlimited);
    const extraSlotsGranted = grant?.extraSlotsGranted || 0;
    const totalLimit = isUnlimited ? 999999 : settings.freeProductsLimit + extraSlotsGranted;

    summaries.push({
      sellerKey: key,
      sellerId: info.sellerId,
      sellerUsername: info.sellerUsername,
      sellerPhone: info.sellerPhone,
      publishedCount: info.count,
      baseFreeLimit: settings.freeProductsLimit,
      extraSlotsGranted,
      totalLimit,
      isUnlimited,
      isBlocked: !isUnlimited && info.count >= totalLimit,
      updatedAt: grant?.updatedAt,
    });
  }

  return summaries;
}

/**
 * Accorde des articles supplémentaires (ou illimité/permanent) à un vendeur
 */
export async function grantSellerExtraQuota(params: {
  sellerKey: string;
  sellerId: string;
  sellerUsername: string;
  sellerPhone: string;
  extraSlotsGranted: number;
  isUnlimited: boolean;
  grantedBy: string;
}): Promise<SellerQuotaSummary[]> {
  const grants = await getAllSellerQuotaGrants();
  const cleanKey = params.sellerKey.trim().toLowerCase();
  const now = new Date().toISOString();

  const idx = grants.findIndex(
    (g) =>
      g.sellerKey.toLowerCase() === cleanKey ||
      g.sellerId.toLowerCase() === params.sellerId.toLowerCase()
  );

  const nextGrant: SellerQuotaGrant = {
    sellerKey: cleanKey,
    sellerId: params.sellerId,
    sellerUsername: params.sellerUsername,
    sellerPhone: params.sellerPhone,
    extraSlotsGranted: params.isUnlimited ? 0 : Math.max(1, params.extraSlotsGranted),
    isUnlimited: params.isUnlimited,
    dismissed: false,
    updatedAt: now,
    grantedBy: params.grantedBy,
  };

  if (idx >= 0) {
    grants[idx] = nextGrant;
  } else {
    grants.unshift(nextGrant);
  }

  await persistSellerQuotaGrants(grants);
  return getSellersAtQuotaSummary();
}

/**
 * Supprime l'autorisation (ou retire l'entrée) d'un vendeur au quota
 */
export async function removeSellerQuotaEntry(sellerKey: string): Promise<SellerQuotaSummary[]> {
  const grants = await getAllSellerQuotaGrants();
  const cleanKey = sellerKey.trim().toLowerCase();
  const idx = grants.findIndex((g) => g.sellerKey.toLowerCase() === cleanKey);

  if (idx >= 0) {
    grants[idx] = {
      ...grants[idx],
      extraSlotsGranted: 0,
      isUnlimited: false,
      dismissed: true,
      updatedAt: new Date().toISOString(),
    };
  } else {
    grants.push({
      sellerKey: cleanKey,
      sellerId: cleanKey,
      sellerUsername: cleanKey,
      sellerPhone: "",
      extraSlotsGranted: 0,
      isUnlimited: false,
      dismissed: true,
      updatedAt: new Date().toISOString(),
      grantedBy: "admin",
    });
  }

  await persistSellerQuotaGrants(grants);
  return getSellersAtQuotaSummary();
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
