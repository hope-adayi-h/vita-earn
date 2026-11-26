import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoredEmploiPost {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  profession: string;
  description: string;
  serviceUrl?: string;
  photoUrl?: string;
  createdAt: string;
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_emploi_write");
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

function getEmploiFilePath(): string {
  return path.join(getDataDir(), "emploi_posts.json");
}

function writeEmploiToFile(posts: StoredEmploiPost[]): void {
  try {
    fs.writeFileSync(getEmploiFilePath(), JSON.stringify(posts, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture emploi_posts.json:", err);
  }
}

export function getLocalEmploiPosts(): StoredEmploiPost[] {
  try {
    const filePath = getEmploiFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(parsed)) {
        return parsed as StoredEmploiPost[];
      }
    }
  } catch {}
  return [];
}

export async function syncEmploiToSupabase(posts: StoredEmploiPost[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "emploi_posts",
        value: posts,
        description: "Publications d'emploi et profils professionnels postés par les utilisateurs",
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur synchronisation emploi_posts dans Supabase:", err);
  }
}

export async function fetchAndSyncEmploiPosts(): Promise<StoredEmploiPost[]> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "emploi_posts")
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        const posts = data.value as StoredEmploiPost[];
        writeEmploiToFile(posts);
        return posts;
      }
    }
  } catch (err) {
    console.warn("Fallback lecture emploi_posts:", err);
  }

  return getLocalEmploiPosts();
}

export async function addEmploiPost(
  input: Omit<StoredEmploiPost, "id" | "createdAt">
): Promise<{ post: StoredEmploiPost; allPosts: StoredEmploiPost[] }> {
  const current = await fetchAndSyncEmploiPosts();
  const post: StoredEmploiPost = {
    ...input,
    id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [post, ...current];
  writeEmploiToFile(updated);
  await syncEmploiToSupabase(updated);
  return { post, allPosts: updated };
}

export async function deleteEmploiPost(id: string): Promise<StoredEmploiPost[]> {
  const current = await fetchAndSyncEmploiPosts();
  const updated = current.filter((p) => p.id !== id);
  writeEmploiToFile(updated);
  await syncEmploiToSupabase(updated);
  return updated;
}
