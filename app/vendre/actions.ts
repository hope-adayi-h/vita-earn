"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findUserByIdentifier } from "@/lib/auth/local-store";
import {
  createStoredProduct,
  getUserStoredProducts,
  getUserMarketplaceQuota,
  getMarketplaceSettings,
  type ProductType,
  type StoredProduct,
  type UserMarketplaceQuota,
  type MarketplaceSettings,
} from "@/lib/data/products-store";

export interface SellerDashboardData {
  user: {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    country: string;
    isActivated: boolean;
  };
  isActivated: boolean;
  quota: UserMarketplaceQuota;
  settings: MarketplaceSettings;
  myProducts: StoredProduct[];
}

/**
 * Récupère l'utilisateur connecté depuis les cookies ou Supabase
 */
export async function getCurrentSeller(): Promise<{
  id: string;
  username: string;
  fullName: string;
  phone: string;
  country: string;
  isActivated: boolean;
} | null> {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      try {
        sessionUser = JSON.parse(decodeURIComponent(sessionUserCookie));
      } catch {}
    }
  }

  const adminUnlocked = cookieStore.get("vita_admin_unlocked")?.value;
  if (adminUnlocked && !sessionUser) {
    sessionUser = {
      id: "usr_espoir_master",
      username: "Espoir",
      fullName: "Espoir",
      email: "adayiespoir60@gmail.com",
      phone: "+228 90 00 00 00",
      country: "TG",
      role: "admin",
      isActivated: true,
    };
  }

  // Restauration automatique si le coffre de comptes est présent
  if (!sessionUser) {
    try {
      const rawAccounts = cookieStore.get("vita_accounts")?.value;
      if (rawAccounts) {
        const accs = JSON.parse(rawAccounts);
        if (Array.isArray(accs) && accs.length > 0) {
          sessionUser = accs[accs.length - 1];
        }
      }
    } catch {}
  }

  const testUser = cookieStore.get("vita_test_user")?.value || sessionUser?.username || (adminUnlocked ? "Espoir" : undefined);
  const testRole = cookieStore.get("vita_test_role")?.value || sessionUser?.role || (adminUnlocked ? "admin" : undefined);
  const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true" || Boolean(adminUnlocked);
  const registeredPhoneCookie = cookieStore.get("vita_registered_phone")?.value;

  // Supabase check
  let supabaseUser: any = null;
  let supabaseProfile: any = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      supabaseUser = user;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, username, phone, is_activated, country")
        .eq("id", user.id)
        .maybeSingle();
      supabaseProfile = prof;
    }
  } catch {}

  const rawUsername =
    supabaseProfile?.username ||
    sessionUser?.username ||
    testUser ||
    "";

  if (!rawUsername && !supabaseUser?.id && !sessionUser?.id && !adminUnlocked) {
    return null;
  }

  // Chercher dans local-store pour avoir les données fraîches
  const stored = rawUsername ? findUserByIdentifier(rawUsername) : null;

  const id = supabaseUser?.id || sessionUser?.id || stored?.id || "usr_" + (rawUsername || "espoir");
  const username = rawUsername || stored?.username || "Espoir";
  const fullName = sessionUser?.fullName || supabaseProfile?.full_name || stored?.username || username;
  const phone = registeredPhoneCookie || sessionUser?.phone || supabaseProfile?.phone || stored?.phone || "+228 90 00 00 00";
  const country = sessionUser?.country || supabaseProfile?.country || stored?.country || "TG";
  const isActivated = Boolean(
    isActivatedCookie ||
    adminUnlocked ||
    sessionUser?.isActivated ||
    stored?.isActivated ||
    supabaseProfile?.is_activated
  );

  return {
    id,
    username,
    fullName,
    phone,
    country,
    isActivated,
  };
}

/**
 * Charge toutes les données nécessaires pour l'espace vendeur
 */
export async function getSellerDashboardData(): Promise<SellerDashboardData | null> {
  try {
    const seller = await getCurrentSeller();
    if (!seller) return null;

    const quota = await getUserMarketplaceQuota(seller.username || seller.id);
    const settings = await getMarketplaceSettings();
    const myProducts = await getUserStoredProducts(seller.username || seller.id);

    return {
      user: seller,
      isActivated: seller.isActivated,
      quota,
      settings,
      myProducts,
    };
  } catch (err) {
    if (
      (err as any)?.digest === "DYNAMIC_SERVER_USAGE" ||
      (err as any)?.digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("Erreur getSellerDashboardData:", err);
    return null;
  }
}

/**
 * Publication d'un nouvel article (vérification du quota gratuit de 2 articles)
 */
export async function publishProductAction(formData: FormData): Promise<{
  success?: boolean;
  product?: StoredProduct;
  error?: string;
}> {
  try {
    const seller = await getCurrentSeller();
    if (!seller) {
      return { error: "Vous devez être connecté pour publier un article." };
    }

    if (!seller.isActivated) {
      return {
        error:
          "Votre compte doit être activé pour pouvoir publier des articles sur la place de marché.",
      };
    }

    const quota = await getUserMarketplaceQuota(seller.username || seller.id);
    const settings = await getMarketplaceSettings();

    // RÈGLE : Quota gratuit de 2 articles maximum par défaut
    if (!quota.canPublish) {
      return {
        error: `Vous avez atteint votre quota de ${quota.freeLimit} articles gratuits. Pour poster un article supplémentaire, veuillez vous acquitter des frais de publication (${settings.extraProductPrice} FCFA) ou contacter le support administrateur.`,
      };
    }

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priceStr = String(formData.get("price") || "").trim();
    const productType = String(formData.get("productType") || "physical") as ProductType;
    const category = String(formData.get("category") || "divers").trim();
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const digitalLink = String(formData.get("digitalLink") || "").trim();
    const sellerPhone = String(formData.get("sellerPhone") || seller.phone || "").trim();
    const sellerLocation = String(formData.get("sellerLocation") || "Lomé, Togo").trim();

    if (!title || title.length < 3) {
      return { error: "Le titre de l'article doit comporter au moins 3 caractères." };
    }

    const price = parseInt(priceStr, 10);
    if (isNaN(price) || price < 100) {
      return { error: "Le prix doit être un nombre valide supérieur ou égal à 100 FCFA." };
    }

    if (!description || description.length < 5) {
      return { error: "Veuillez fournir une description détaillée de votre article ou service." };
    }

    // 1 photo / affiche obligatoire
    if (!imageUrl) {
      return {
        error: "Une photo ou affiche principale de votre produit est obligatoire.",
      };
    }

    if (!sellerPhone) {
      return {
        error: "Veuillez indiquer un numéro de téléphone joignable pour les acheteurs.",
      };
    }

    // Pour les produits numériques, vérifier le lien si fourni
    if (productType === "digital" && digitalLink) {
      if (!digitalLink.startsWith("http://") && !digitalLink.startsWith("https://")) {
        return {
          error: "Le lien de téléchargement doit débuter par https:// ou http:// (ex: Google Drive, Canva, etc.).",
        };
      }
    }

    const result = await createStoredProduct({
      sellerId: seller.id,
      sellerUsername: seller.username || seller.fullName,
      sellerPhone,
      sellerLocation,
      title,
      description,
      price,
      productType,
      category,
      imageUrl,
      digitalLink: productType === "digital" && digitalLink ? digitalLink : undefined,
    });

    if (!result.success || !result.product) {
      return { error: result.error || "Erreur lors de l'enregistrement de l'article." };
    }

    revalidatePath("/vendre");
    revalidatePath("/marche");
    revalidatePath("/admin/produits");

    return { success: true, product: result.product };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Une erreur inattendue est survenue.";
    return { error: msg };
  }
}
