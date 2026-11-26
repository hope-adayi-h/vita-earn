import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";

export type KycDocumentType = "cni" | "school_card";
export type KycStatus = "pending" | "approved" | "rejected";

export interface StoredKycRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  phone: string;
  documentType: KycDocumentType;
  frontImageUrl: string;
  backImageUrl: string;
  selfieImageUrl: string;
  status: KycStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_kyc_write");
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

function getKycFilePath(): string {
  return path.join(getDataDir(), "seller_kyc_requests.json");
}

function writeKycToFile(items: StoredKycRequest[]): void {
  try {
    fs.writeFileSync(getKycFilePath(), JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture seller_kyc_requests.json:", err);
  }
}

export function getLocalKycRequests(): StoredKycRequest[] {
  try {
    const filePath = getKycFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(parsed)) {
        return parsed as StoredKycRequest[];
      }
    }
  } catch {}
  return [];
}

export async function syncKycToSupabase(items: StoredKycRequest[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "seller_kyc_requests",
        value: items,
        description: "Demandes de vérification KYC des vendeurs Marketplace",
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur synchronisation seller_kyc_requests dans Supabase:", err);
  }
}

export async function fetchAndSyncKycRequests(): Promise<StoredKycRequest[]> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "seller_kyc_requests")
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        const items = data.value as StoredKycRequest[];
        writeKycToFile(items);
        return items;
      }
    }
  } catch (err) {
    console.warn("Fallback lecture seller_kyc_requests:", err);
  }

  return getLocalKycRequests();
}

export async function getUserKycRequest(
  userId: string,
  username?: string
): Promise<StoredKycRequest | null> {
  const all = await fetchAndSyncKycRequests();
  const cleanId = (userId || "").trim().toLowerCase();
  const cleanUser = (username || "").trim().toLowerCase();

  return (
    all.find(
      (k) =>
        (cleanId && k.userId.trim().toLowerCase() === cleanId) ||
        (cleanUser && k.username.trim().toLowerCase() === cleanUser)
    ) || null
  );
}

export async function submitKycRequest(input: {
  userId: string;
  username: string;
  fullName: string;
  phone: string;
  documentType: KycDocumentType;
  frontImageUrl: string;
  backImageUrl: string;
  selfieImageUrl: string;
}): Promise<StoredKycRequest> {
  const current = await fetchAndSyncKycRequests();
  const now = new Date().toISOString();
  const cleanId = input.userId.trim().toLowerCase();
  const cleanUser = input.username.trim().toLowerCase();

  const existingIndex = current.findIndex(
    (k) =>
      k.userId.trim().toLowerCase() === cleanId ||
      (cleanUser && k.username.trim().toLowerCase() === cleanUser)
  );

  if (existingIndex >= 0 && current[existingIndex].status === "approved") {
    return current[existingIndex];
  }

  const record: StoredKycRequest = {
    id:
      existingIndex >= 0
        ? current[existingIndex].id
        : `kyc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    username: input.username,
    fullName: input.fullName,
    phone: input.phone,
    documentType: input.documentType,
    frontImageUrl: input.frontImageUrl,
    backImageUrl: input.backImageUrl,
    selfieImageUrl: input.selfieImageUrl,
    status: "pending",
    rejectionReason: undefined,
    createdAt: existingIndex >= 0 ? current[existingIndex].createdAt : now,
    updatedAt: now,
  };

  let updated: StoredKycRequest[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = record;
  } else {
    updated = [record, ...current];
  }

  writeKycToFile(updated);
  await syncKycToSupabase(updated);
  return record;
}

export async function reviewKycRequest(params: {
  id: string;
  decision: "approved" | "rejected";
  reviewedBy: string;
  reason?: string;
}): Promise<{ request: StoredKycRequest | null; all: StoredKycRequest[] }> {
  const current = await fetchAndSyncKycRequests();
  const idx = current.findIndex((k) => k.id === params.id);
  if (idx < 0) {
    return { request: null, all: current };
  }

  const now = new Date().toISOString();
  const updatedReq: StoredKycRequest = {
    ...current[idx],
    status: params.decision,
    rejectionReason: params.decision === "rejected" ? params.reason?.trim() || "Documents non conformes ou illisibles." : undefined,
    reviewedBy: params.reviewedBy,
    reviewedAt: now,
    updatedAt: now,
  };

  const updatedAll = [...current];
  updatedAll[idx] = updatedReq;

  writeKycToFile(updatedAll);
  await syncKycToSupabase(updatedAll);

  // Synchroniser également profiles.kyc_status dans Supabase si l'UUID correspond
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      updatedReq.userId
    );
    if (isConfigured && isUuid) {
      const adminClient = createAdminClient();
      await adminClient
        .from("profiles")
        .update({
          kyc_status: params.decision === "approved" ? "verified" : "rejected",
        })
        .eq("id", updatedReq.userId);
    }
  } catch (err) {
    console.warn("Note synchronisation profiles.kyc_status:", err);
  }

  return { request: updatedReq, all: updatedAll };
}
