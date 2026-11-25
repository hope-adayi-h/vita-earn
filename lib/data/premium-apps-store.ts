import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export type PremiumAppId = "netflix" | "vita-canal-plus" | "gemini-pro" | "telegram";

export interface StoredPremiumApp {
  id: PremiumAppId;
  order: number;
  name: string;
  subtitle: string;
  description: string;
  targetUrl: string;
  isComingSoon: boolean;
  updatedAt: string;
}

export const DEFAULT_PREMIUM_APPS: StoredPremiumApp[] = [
  {
    id: "netflix",
    order: 1,
    name: "Netflix Premium",
    subtitle: "Streaming HD & 4K illimité",
    description:
      "Accédez à l'application Netflix Premium incluse avec votre adhésion pour profiter des films, séries et documentaires.",
    targetUrl: "",
    isComingSoon: false,
    updatedAt: "2026-11-25T00:00:00.000Z",
  },
  {
    id: "vita-canal-plus",
    order: 2,
    name: "Vita Canal+",
    subtitle: "Chaînes TV, Sport & Cinéma en direct",
    description:
      "Regardez vos chaînes Canal+, matchs en direct et programmes exclusifs depuis votre appareil.",
    targetUrl: "",
    isComingSoon: false,
    updatedAt: "2026-11-25T00:00:00.000Z",
  },
  {
    id: "gemini-pro",
    order: 3,
    name: "Gemini Pro (12 mois)",
    subtitle: "Abonnement IA Google — 12 mois",
    description:
      "Profitez de Gemini Pro pendant 12 mois pour booster votre productivité, rédiger, analyser et créer plus vite.",
    targetUrl: "",
    isComingSoon: false,
    updatedAt: "2026-11-25T00:00:00.000Z",
  },
  {
    id: "telegram",
    order: 4,
    name: "Telegram",
    subtitle: "Messagerie & Outils Premium",
    description:
      "Accès aux fonctionnalités et ressources Telegram pour les membres Vita Earn.",
    targetUrl: "",
    isComingSoon: true,
    updatedAt: "2026-11-25T00:00:00.000Z",
  },
];

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_apps_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return tmpDir;
  }
}

function getAppsFilePath(): string {
  return path.join(getDataDir(), "premium_apps.json");
}

function writeAppsToFile(apps: StoredPremiumApp[]): void {
  try {
    fs.writeFileSync(getAppsFilePath(), JSON.stringify(apps, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture premium_apps.json:", err);
  }
}

/**
 * Normalise et garantit l'ordre exact des 4 applications :
 * 1. Netflix Premium
 * 2. Vita Canal+
 * 3. Gemini Pro (12 mois)
 * 4. Telegram
 */
function mergeWithDefaults(incoming: StoredPremiumApp[]): StoredPremiumApp[] {
  const byId = new Map(incoming.map((a) => [a.id, a]));
  return DEFAULT_PREMIUM_APPS.map((def) => {
    const found = byId.get(def.id);
    if (!found) return def;
    return {
      ...def,
      targetUrl: typeof found.targetUrl === "string" ? found.targetUrl : "",
      isComingSoon:
        typeof found.isComingSoon === "boolean" ? found.isComingSoon : def.isComingSoon,
      updatedAt: found.updatedAt || def.updatedAt,
    };
  }).sort((a, b) => a.order - b.order);
}

export function getLocalPremiumApps(): StoredPremiumApp[] {
  try {
    const filePath = getAppsFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeWithDefaults(parsed as StoredPremiumApp[]);
      }
    }
  } catch {}
  return DEFAULT_PREMIUM_APPS;
}

export async function syncPremiumAppsToSupabase(apps: StoredPremiumApp[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "premium_applications",
        value: apps,
        description: "Liens et statuts des 4 Applications Premium (Netflix, Vita Canal+, Gemini Pro, Telegram)",
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur synchronisation premium_applications dans Supabase:", err);
  }
}

export async function fetchAndSyncPremiumApps(): Promise<StoredPremiumApp[]> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "premium_applications")
        .maybeSingle();

      if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
        const merged = mergeWithDefaults(data.value as StoredPremiumApp[]);
        writeAppsToFile(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("Fallback lecture premium_applications:", err);
  }

  return getLocalPremiumApps();
}

export async function saveSinglePremiumApp(params: {
  id: PremiumAppId;
  targetUrl: string;
  isComingSoon: boolean;
}): Promise<StoredPremiumApp[]> {
  const current = await fetchAndSyncPremiumApps();
  const now = new Date().toISOString();

  const updated = current.map((app) =>
    app.id === params.id
      ? {
          ...app,
          targetUrl: params.targetUrl,
          isComingSoon: params.isComingSoon,
          updatedAt: now,
        }
      : app
  );

  writeAppsToFile(updated);
  await syncPremiumAppsToSupabase(updated);
  return updated;
}
