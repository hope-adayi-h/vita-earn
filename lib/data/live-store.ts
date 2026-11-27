import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export type LiveStatus = "pending" | "approved" | "rejected" | "live" | "ended";

export interface LiveConference {
  id: string;
  userId: string;
  applicantName: string;
  applicantPhone: string;
  title: string;
  description: string;
  category: string;
  scheduledDate: string; // Format: YYYY-MM-DD
  scheduledTime: string; // Format: HH:mm
  durationMinutes: number;
  meetUrl: string; // Lien Google Meet ou équivalent
  coverImageUrl?: string;
  status: LiveStatus;
  adminMessage?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveSubscription {
  liveId: string;
  userIdentifier: string;
  subscribedAt: string;
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_live_write");
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

function getLiveFilePath(): string {
  return path.join(getDataDir(), "live_conferences.json");
}

function getSubscribersFilePath(): string {
  return path.join(getDataDir(), "live_subscribers.json");
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Erreur lecture ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Erreur écriture ${filePath}:`, err);
  }
}

// -------------------------------------------------------------
// SUPABASE SYNC (platform_settings)
// -------------------------------------------------------------
export async function syncLiveConferencesToSupabase(items: LiveConference[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient
        .from("platform_settings")
        .upsert(
          {
            key: "live_conferences",
            value: {
              items,
              updatedAt: new Date().toISOString(),
            },
            description: "Liste des conférences et formations Live Vita Earn",
          },
          { onConflict: "key" }
        );
    }
  } catch (err) {
    console.warn("Synchronisation Supabase platform_settings (live_conferences) échouée:", err);
  }
}

export async function syncLiveSubscribersToSupabase(subs: LiveSubscription[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient
        .from("platform_settings")
        .upsert(
          {
            key: "live_subscribers",
            value: {
              subs,
              updatedAt: new Date().toISOString(),
            },
            description: "Abonnements aux notifications de conférences Live",
          },
          { onConflict: "key" }
        );
    }
  } catch (err) {
    console.warn("Synchronisation Supabase platform_settings (live_subscribers) échouée:", err);
  }
}

// -------------------------------------------------------------
// READ ALL LIVE CONFERENCES
// -------------------------------------------------------------
export async function getAllLiveConferences(): Promise<LiveConference[]> {
  // 1. Lire d'abord localement
  let items = readJsonFile<LiveConference[]>(getLiveFilePath(), []);

  // 2. Si vide ou sur Netlify serverless, vérifier Supabase
  if (items.length === 0) {
    try {
      const isConfigured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

      if (isConfigured) {
        const adminClient = createAdminClient();
        const { data } = await adminClient
          .from("platform_settings")
          .select("value")
          .eq("key", "live_conferences")
          .maybeSingle();

        if (data?.value?.items && Array.isArray(data.value.items)) {
          items = data.value.items;
          writeJsonFile(getLiveFilePath(), items);
        }
      }
    } catch {}
  }

  // Tri par date de programmation (les plus récents ou futurs en premier)
  return items.sort((a, b) => {
    const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime || "00:00"}`).getTime();
    const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime || "00:00"}`).getTime();
    return dateA - dateB;
  });
}

// -------------------------------------------------------------
// GET APPROVED & ACTIVE LIVES (FOR PUBLIC VIEW)
// -------------------------------------------------------------
export async function getApprovedAndActiveLives(): Promise<LiveConference[]> {
  const all = await getAllLiveConferences();
  return all.filter((item) => item.status === "approved" || item.status === "live");
}

// -------------------------------------------------------------
// GET SINGLE LIVE BY ID
// -------------------------------------------------------------
export async function getLiveById(id: string): Promise<LiveConference | null> {
  const all = await getAllLiveConferences();
  return all.find((item) => item.id === id) || null;
}

// -------------------------------------------------------------
// CREATE LIVE REQUEST (USER)
// -------------------------------------------------------------
export async function createLiveRequest(data: {
  userId: string;
  applicantName: string;
  applicantPhone: string;
  title: string;
  description: string;
  category?: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes?: number;
  meetUrl?: string;
  coverImageUrl?: string;
}): Promise<LiveConference> {
  const all = await getAllLiveConferences();

  const newLive: LiveConference = {
    id: `live_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: data.userId || "anonymous",
    applicantName: data.applicantName.trim(),
    applicantPhone: data.applicantPhone.trim(),
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category?.trim() || "Formation & Conférence",
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    durationMinutes: Number(data.durationMinutes) || 60,
    meetUrl: data.meetUrl?.trim() || "https://meet.google.com/new",
    coverImageUrl: data.coverImageUrl?.trim() || "",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newLive, ...all];
  writeJsonFile(getLiveFilePath(), updated);
  await syncLiveConferencesToSupabase(updated);

  return newLive;
}

// -------------------------------------------------------------
// REVIEW LIVE REQUEST (ADMIN)
// -------------------------------------------------------------
export async function reviewLiveRequest(params: {
  id: string;
  status: LiveStatus;
  adminMessage?: string;
  meetUrl?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  reviewedBy?: string;
}): Promise<LiveConference | null> {
  const all = await getAllLiveConferences();
  const index = all.findIndex((item) => item.id === params.id);
  if (index === -1) return null;

  const current = all[index];
  const updatedItem: LiveConference = {
    ...current,
    status: params.status,
    adminMessage: params.adminMessage !== undefined ? params.adminMessage.trim() : current.adminMessage,
    meetUrl: params.meetUrl ? params.meetUrl.trim() : current.meetUrl,
    scheduledDate: params.scheduledDate ? params.scheduledDate : current.scheduledDate,
    scheduledTime: params.scheduledTime ? params.scheduledTime : current.scheduledTime,
    reviewedBy: params.reviewedBy || "Administrateur",
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all[index] = updatedItem;
  writeJsonFile(getLiveFilePath(), all);
  await syncLiveConferencesToSupabase(all);

  return updatedItem;
}

// -------------------------------------------------------------
// TOGGLE STATUS DIRECTLY (e.g. set to 'live' or 'ended')
// -------------------------------------------------------------
export async function toggleLiveStatus(id: string, newStatus: LiveStatus): Promise<LiveConference | null> {
  const all = await getAllLiveConferences();
  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return null;

  all[index].status = newStatus;
  all[index].updatedAt = new Date().toISOString();

  writeJsonFile(getLiveFilePath(), all);
  await syncLiveConferencesToSupabase(all);

  return all[index];
}

// -------------------------------------------------------------
// DELETE LIVE
// -------------------------------------------------------------
export async function deleteLiveConference(id: string): Promise<boolean> {
  const all = await getAllLiveConferences();
  const filtered = all.filter((item) => item.id !== id);
  if (filtered.length === all.length) return false;

  writeJsonFile(getLiveFilePath(), filtered);
  await syncLiveConferencesToSupabase(filtered);

  // Supprimer aussi les abonnements liés
  const subs = readJsonFile<LiveSubscription[]>(getSubscribersFilePath(), []);
  const filteredSubs = subs.filter((s) => s.liveId !== id);
  writeJsonFile(getSubscribersFilePath(), filteredSubs);
  await syncLiveSubscribersToSupabase(filteredSubs);

  return true;
}

// -------------------------------------------------------------
// BELL NOTIFICATION REMINDERS (CLOCHE DE RAPPEL)
// -------------------------------------------------------------
export async function getAllLiveSubscriptions(): Promise<LiveSubscription[]> {
  let subs = readJsonFile<LiveSubscription[]>(getSubscribersFilePath(), []);
  if (subs.length === 0) {
    try {
      const isConfigured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

      if (isConfigured) {
        const adminClient = createAdminClient();
        const { data } = await adminClient
          .from("platform_settings")
          .select("value")
          .eq("key", "live_subscribers")
          .maybeSingle();

        if (data?.value?.subs && Array.isArray(data.value.subs)) {
          subs = data.value.subs;
          writeJsonFile(getSubscribersFilePath(), subs);
        }
      }
    } catch {}
  }
  return subs;
}

export async function toggleLiveReminder(
  liveId: string,
  userIdentifier: string
): Promise<{ isSubscribed: boolean; count: number }> {
  const subs = await getAllLiveSubscriptions();
  const index = subs.findIndex(
    (s) => s.liveId === liveId && s.userIdentifier === userIdentifier
  );

  let isSubscribed = false;
  if (index >= 0) {
    // Désabonner
    subs.splice(index, 1);
    isSubscribed = false;
  } else {
    // S'abonner
    subs.push({
      liveId,
      userIdentifier,
      subscribedAt: new Date().toISOString(),
    });
    isSubscribed = true;
  }

  writeJsonFile(getSubscribersFilePath(), subs);
  await syncLiveSubscribersToSupabase(subs);

  const count = subs.filter((s) => s.liveId === liveId).length;
  return { isSubscribed, count };
}

export async function getUserSubscribedLiveIds(userIdentifier: string): Promise<string[]> {
  if (!userIdentifier) return [];
  const subs = await getAllLiveSubscriptions();
  return subs.filter((s) => s.userIdentifier === userIdentifier).map((s) => s.liveId);
}

// -------------------------------------------------------------
// CHECK BANNER ALERTS (FOR HOMEPAGE)
// -------------------------------------------------------------
export interface LiveAlertPayload {
  activeLive: LiveConference | null; // Actuellement en direct (bouton rouge clignotant)
  imminentLive: LiveConference | null; // Démarre dans moins de 10 min
  tomorrowLive: LiveConference | null; // Démarre demain (pour rappel 24h)
}

export async function getLiveAlerts(userSubscribedIds: string[] = []): Promise<LiveAlertPayload> {
  const lives = await getAllLiveConferences();
  const now = new Date().getTime();

  let activeLive: LiveConference | null = null;
  let imminentLive: LiveConference | null = null;
  let tomorrowLive: LiveConference | null = null;

  for (const item of lives) {
    if (item.status === "rejected" || item.status === "ended") continue;

    // 1. Si manuellement marqué "live" par l'admin
    if (item.status === "live") {
      activeLive = item;
      continue;
    }

    if (item.status === "approved") {
      const scheduledDateTime = new Date(`${item.scheduledDate}T${item.scheduledTime || "00:00"}`).getTime();
      const diffMs = scheduledDateTime - now;
      const diffMinutes = Math.floor(diffMs / (60 * 1000));
      const diffHours = diffMs / (60 * 60 * 1000);

      // Si le live a débuté depuis moins de 90 minutes (et n'est pas encore 'ended')
      if (diffMinutes <= 0 && diffMinutes >= -90) {
        activeLive = item;
      }
      // Si le live commence dans les 10 prochaines minutes
      else if (diffMinutes > 0 && diffMinutes <= 10) {
        imminentLive = item;
      }
      // Si le live est demain (entre 18h et 30h plus tard) et que l'utilisateur s'est abonné à la cloche
      else if (diffHours >= 18 && diffHours <= 30) {
        if (userSubscribedIds.includes(item.id)) {
          tomorrowLive = item;
        }
      }
    }
  }

  return { activeLive, imminentLive, tomorrowLive };
}
