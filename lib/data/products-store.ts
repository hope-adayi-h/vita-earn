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

const SEED_PRODUCTS: StoredProduct[] = [
  {
    id: "prod_seed_1",
    sellerId: "usr_seed_1",
    sellerUsername: "Digital Academy Lomé",
    sellerPhone: "+228 90 12 34 56",
    sellerLocation: "Lomé, Togo",
    title: "Pack Formation Vente WhatsApp & E-commerce 2026",
    description:
      "Guide complet étape par étape pour automatiser vos ventes sur WhatsApp Business et acquérir des clients au Togo et en Afrique de l'Ouest.",
    price: 4500,
    productType: "digital",
    category: "digital",
    imageUrl:
      "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80",
    digitalLink: "https://drive.google.com/drive/folders/formation-whatsapp-2026",
    status: "active",
    createdAt: "2026-11-15T10:00:00.000Z",
    updatedAt: "2026-11-15T10:00:00.000Z",
  },
  {
    id: "prod_seed_2",
    sellerId: "usr_seed_2",
    sellerUsername: "Tech Store Lomé",
    sellerPhone: "+228 91 23 45 67",
    sellerLocation: "Lomé (Tokoin)",
    title: "Montre Connectée Sport & Santé Pro étanche",
    description:
      "Suivi du rythme cardiaque, notifications WhatsApp et appels Bluetooth, autonomie 7 jours. Compatible Android et iPhone.",
    price: 16500,
    productType: "physical",
    category: "tech",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    status: "active",
    createdAt: "2026-11-16T11:30:00.000Z",
    updatedAt: "2026-11-16T11:30:00.000Z",
  },
  {
    id: "prod_seed_3",
    sellerId: "usr_seed_3",
    sellerUsername: "Studio Graphik Togo",
    sellerPhone: "+228 92 34 56 78",
    sellerLocation: "Lomé, Togo",
    title: "150+ Templates Canva Pro pour Vendeurs Africains",
    description:
      "Visuels percutants pour vos publications Facebook, Instagram et statuts WhatsApp adaptés au marché francophone.",
    price: 3500,
    productType: "digital",
    category: "digital",
    imageUrl:
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
    digitalLink: "https://www.canva.com/templates/afrique-pro-pack-150",
    status: "active",
    createdAt: "2026-11-17T14:15:00.000Z",
    updatedAt: "2026-11-17T14:15:00.000Z",
  },
  {
    id: "prod_seed_4",
    sellerId: "usr_seed_4",
    sellerUsername: "Afrik Électro",
    sellerPhone: "+228 93 45 67 89",
    sellerLocation: "Lomé (Assivito)",
    title: "Écouteurs Sans Fil TWS Bluetooth 5.3 Stéréo",
    description:
      "Son puissant haute fidélité, réduction de bruit passive, boîte de charge avec affichage LED numérique.",
    price: 8500,
    productType: "physical",
    category: "tech",
    imageUrl:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    status: "active",
    createdAt: "2026-11-18T09:45:00.000Z",
    updatedAt: "2026-11-18T09:45:00.000Z",
  },
  {
    id: "prod_seed_5",
    sellerId: "usr_seed_5",
    sellerUsername: "Service Pro Consulting",
    sellerPhone: "+228 90 88 77 66",
    sellerLocation: "Lomé, Togo",
    title: "Prestation Création & Optimisation de Page Facebook Pro",
    description:
      "Configuration complète de votre page Facebook et WhatsApp Business avec tunnel de vente, visuels de couverture et paramétrage des réponses automatiques.",
    price: 15000,
    productType: "service",
    category: "service",
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
    status: "active",
    createdAt: "2026-11-19T08:20:00.000Z",
    updatedAt: "2026-11-19T08:20:00.000Z",
  },
];

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

      if (!error && Array.isArray(data?.value) && data.value.length > 0) {
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
