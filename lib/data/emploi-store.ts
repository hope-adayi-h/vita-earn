import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoredEmploiPost {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  profession: string;
  description: string;
  serviceUrl?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
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

export async function upsertEmploiPostForUser(
  userId: string,
  input: Omit<StoredEmploiPost, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<{ post: StoredEmploiPost; allPosts: StoredEmploiPost[]; isUpdate: boolean }> {
  const current = await fetchAndSyncEmploiPosts();
  const now = new Date().toISOString();
  const existingIndex = current.findIndex((p) => p.userId && p.userId === userId);

  if (existingIndex >= 0) {
    const updatedPost: StoredEmploiPost = {
      ...current[existingIndex],
      ...input,
      userId,
      updatedAt: now,
    };
    const updated = [...current];
    updated[existingIndex] = updatedPost;
    writeEmploiToFile(updated);
    await syncEmploiToSupabase(updated);
    return { post: updatedPost, allPosts: updated, isUpdate: true };
  }

  const post: StoredEmploiPost = {
    ...input,
    userId,
    id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [post, ...current];
  writeEmploiToFile(updated);
  await syncEmploiToSupabase(updated);
  return { post, allPosts: updated, isUpdate: false };
}

export async function deleteEmploiPost(id: string): Promise<StoredEmploiPost[]> {
  const current = await fetchAndSyncEmploiPosts();
  const updated = current.filter((p) => p.id !== id);
  writeEmploiToFile(updated);
  await syncEmploiToSupabase(updated);
  return updated;
}
