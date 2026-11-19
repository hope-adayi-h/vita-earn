import fs from "fs";
import path from "path";
import os from "os";

export interface StoredWithdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethod: string;
  phoneNumber: string;
  accountName: string;
  status: "pending" | "processing" | "approved" | "paid" | "rejected";
  adminNote?: string | null;
  payoutRef?: string | null;
  payoutProvider?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_write_wdr");
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

function getFilePath(): string {
  const dir = getDataDir();
  return path.join(dir, "withdrawals.json");
}

function ensureDirectoryAndFile(): string {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    // Seed initial withdrawals demonstratifs pour l'admin
    const initialWithdrawals: StoredWithdrawal[] = [
      {
        id: "wdr_init_01",
        userId: "usr_espoir_master",
        userName: "Espoir",
        amount: 25000,
        fee: 1250, // 5%
        netAmount: 23750,
        paymentMethod: "tmoney",
        phoneNumber: "+228 90 00 00 00",
        accountName: "Espoir Adayi",
        status: "paid",
        adminNote: "Virement T-Money validé avec succès via SasPay",
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        processedAt: new Date(Date.now() - 3600000 * 24 * 2 + 1800000).toISOString(),
      },
      {
        id: "wdr_init_02",
        userId: "usr_seed_member_1",
        userName: "Kodjo Mensah",
        amount: 15000,
        fee: 750, // 5%
        netAmount: 14250,
        paymentMethod: "flooz",
        phoneNumber: "+228 99 12 34 56",
        accountName: "Kodjo Mensah",
        status: "paid",
        adminNote: "Validé par administrateur",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        processedAt: new Date(Date.now() - 3600000 * 17).toISOString(),
      },
      {
        id: "wdr_init_03",
        userId: "usr_seed_member_2",
        userName: "Amina Diallo",
        amount: 10000,
        fee: 500, // 5%
        netAmount: 9500,
        paymentMethod: "tmoney",
        phoneNumber: "+228 91 88 77 66",
        accountName: "Amina Diallo",
        status: "pending",
        adminNote: null,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ];
    try {
      fs.writeFileSync(filePath, JSON.stringify(initialWithdrawals, null, 2), "utf-8");
    } catch {}
  }
  return filePath;
}

export function getAllStoredWithdrawals(): StoredWithdrawal[] {
  try {
    const filePath = ensureDirectoryAndFile();
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as StoredWithdrawal[];
  } catch (err) {
    console.error("Erreur lecture withdrawals.json:", err);
    return [];
  }
}

export function saveStoredWithdrawal(withdrawal: StoredWithdrawal): void {
  try {
    const filePath = ensureDirectoryAndFile();
    const withdrawals = getAllStoredWithdrawals();
    const index = withdrawals.findIndex((w) => w.id === withdrawal.id);
    if (index >= 0) {
      withdrawals[index] = withdrawal;
    } else {
      withdrawals.unshift(withdrawal);
    }
    fs.writeFileSync(filePath, JSON.stringify(withdrawals, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture withdrawals.json:", err);
  }
}

export function updateStoredWithdrawalStatus(
  id: string,
  status: StoredWithdrawal["status"],
  notes?: string | null,
  payoutData?: { payoutRef?: string; payoutProvider?: string }
): boolean {
  try {
    const filePath = ensureDirectoryAndFile();
    const withdrawals = getAllStoredWithdrawals();
    const item = withdrawals.find((w) => w.id === id);
    if (!item) return false;

    item.status = status;
    if (notes !== undefined) item.adminNote = notes;
    if (payoutData?.payoutRef) item.payoutRef = payoutData.payoutRef;
    if (payoutData?.payoutProvider) item.payoutProvider = payoutData.payoutProvider;
    if (status === "paid" || status === "approved") {
      item.processedAt = new Date().toISOString();
    }

    fs.writeFileSync(filePath, JSON.stringify(withdrawals, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erreur mise à jour statut retrait:", err);
    return false;
  }
}

export function getStoredWithdrawalStats() {
  const withdrawals = getAllStoredWithdrawals();
  let totalWithdrawnCompleted = 0;
  let completedCount = 0;
  let pendingAmount = 0;
  let pendingCount = 0;
  let processingAmount = 0;
  let processingCount = 0;

  const methods = {
    tmoney: 0,
    flooz: 0,
    wave: 0,
    mtn: 0,
  };

  withdrawals.forEach((w) => {
    const amt = Number(w.amount) || 0;
    if (w.status === "approved" || w.status === "paid") {
      totalWithdrawnCompleted += amt;
      completedCount++;
    } else if (w.status === "pending") {
      pendingAmount += amt;
      pendingCount++;
    } else if (w.status === "processing") {
      processingAmount += amt;
      processingCount++;
    }

    const meth = (w.paymentMethod || "").toLowerCase();
    if (meth.includes("flooz") || meth.includes("moov")) methods.flooz += amt;
    else if (meth.includes("wave")) methods.wave += amt;
    else if (meth.includes("mtn")) methods.mtn += amt;
    else methods.tmoney += amt;
  });

  return {
    totalWithdrawnCompleted,
    completedCount,
    pendingAmount,
    pendingCount,
    processingAmount,
    processingCount,
    methods,
    withdrawals,
  };
}
