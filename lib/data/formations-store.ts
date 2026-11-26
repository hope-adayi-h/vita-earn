import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoredFormationItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_formations_write");
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

function getFormationsFilePath(): string {
  return path.join(getDataDir(), "formations_catalog.json");
}

function writeFormationsToFile(items: StoredFormationItem[]): void {
  try {
    fs.writeFileSync(getFormationsFilePath(), JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture formations_catalog.json:", err);
  }
}

export function getLocalFormations(): StoredFormationItem[] {
  try {
    const filePath = getFormationsFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(parsed)) {
        return parsed as StoredFormationItem[];
      }
    }
  } catch {}
  return [];
}

export async function syncFormationsToSupabase(items: StoredFormationItem[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "formations_catalog",
        value: items,
        description: "Catalogue des formations ajoutées par l'administrateur",
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur synchronisation formations_catalog dans Supabase:", err);
  }
}

export async function fetchAndSyncFormations(): Promise<StoredFormationItem[]> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "formations_catalog")
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        const items = data.value as StoredFormationItem[];
        writeFormationsToFile(items);
        return items;
      }
    }
  } catch (err) {
    console.warn("Fallback lecture formations_catalog:", err);
  }

  return getLocalFormations();
}

export async function addFormationItem(
  input: Omit<StoredFormationItem, "id" | "createdAt" | "updatedAt">
): Promise<{ item: StoredFormationItem; allItems: StoredFormationItem[] }> {
  const current = await fetchAndSyncFormations();
  const now = new Date().toISOString();
  const item: StoredFormationItem = {
    ...input,
    id: `form_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [item, ...current];
  writeFormationsToFile(updated);
  await syncFormationsToSupabase(updated);
  return { item, allItems: updated };
}

export async function deleteFormationItem(id: string): Promise<StoredFormationItem[]> {
  const current = await fetchAndSyncFormations();
  const updated = current.filter((f) => f.id !== id);
  writeFormationsToFile(updated);
  await syncFormationsToSupabase(updated);
  return updated;
}
