import fs from "fs";
import path from "path";
import os from "os";

export interface StoredDeposit {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  operator: string;
  amount: number;
  currency: string;
  purpose: string;
  status: "succeeded" | "pending" | "failed" | "cancelled";
  provider: "saspay" | "MANUAL_ADMIN" | "mock";
  providerRef: string;
  confirmationSource: string;
  createdAt: string;
  confirmedAt?: string | null;
}

export function resolveOperatorName(channel?: string, phone?: string): string {
  const ch = (channel || "").toLowerCase();
  const digits = (phone || "").replace(/[\s\-\(\)\+]/g, "");

  if (ch.includes("tmoney") || ch.includes("tg_tmoney")) return "T-Money (Togocel)";
  if (ch.includes("flooz") || ch.includes("tg_moov") || ch.includes("tg_flooz")) return "Moov Flooz (Togo)";
  if (ch.includes("wave")) return "Wave Mobile Money";
  if (ch.includes("mtn_bj") || ch.includes("bj_mtn")) return "MTN MoMo (Bénin)";
  if (ch.includes("moov_bj") || ch.includes("bj_moov")) return "Moov Money (Bénin)";
  if (ch.includes("orange_ci") || ch.includes("ci_orange")) return "Orange Money (Côte d'Ivoire)";
  if (ch.includes("mtn_ci") || ch.includes("ci_mtn")) return "MTN MoMo (Côte d'Ivoire)";
  if (ch.includes("orange_sn") || ch.includes("sn_orange")) return "Orange Money (Sénégal)";
  if (ch.includes("orange_bf") || ch.includes("bf_orange")) return "Orange Money (Burkina Faso)";
  if (ch.includes("airtel_ne") || ch.includes("ne_airtel")) return "Airtel Money (Niger)";
  if (ch.includes("orange_gn") || ch.includes("gn_orange")) return "Orange Money (Guinée)";
  if (ch.includes("airtel_ga") || ch.includes("ga_airtel")) return "Airtel Money (Gabon)";
  if (ch.includes("airtel_cg") || ch.includes("cg_airtel")) return "Airtel / MTN (Congo)";
  if (ch.includes("mtn_gh") || ch.includes("gh_mtn")) return "MTN MoMo (Ghana)";
  if (ch.includes("mtn_zm") || ch.includes("zm_mtn")) return "MTN Money (Zambie)";
  if (ch.includes("mtn_cm") || ch.includes("cm_mtn")) return "MTN MoMo (Cameroun)";
  if (ch.includes("orange_cm") || ch.includes("cm_orange")) return "Orange Money (Cameroun)";
  if (ch.includes("card")) return "Carte Bancaire (Visa/Mastercard)";

  // Déduction par numéro de téléphone
  if (digits.startsWith("228")) {
    const sub = digits.slice(3);
    if (/^[97][0-3]/.test(sub)) return "T-Money (Togocel)";
    if (/^9[6-9]/.test(sub)) return "Moov Flooz (Togo)";
    return "T-Money (Togocel)";
  }
  if (digits.startsWith("229")) return "MTN MoMo (Bénin)";
  if (digits.startsWith("225")) return "Orange / MTN (Côte d'Ivoire)";
  if (digits.startsWith("221")) return "Wave / Orange (Sénégal)";
  if (digits.startsWith("226")) return "Orange Money (Burkina Faso)";
  if (digits.startsWith("227")) return "Airtel Money (Niger)";
  if (digits.startsWith("224")) return "Orange Money (Guinée)";
  if (digits.startsWith("241")) return "Airtel Money (Gabon)";
  if (digits.startsWith("242") || digits.startsWith("243")) return "Airtel / MTN (Congo)";
  if (digits.startsWith("233")) return "MTN MoMo (Ghana)";
  if (digits.startsWith("260")) return "MTN Money (Zambie)";
  if (digits.startsWith("237")) return "MTN MoMo (Cameroun)";

  return "T-Money (Togocel)";
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_write_dep");
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
  return path.join(dir, "deposits.json");
}

function ensureDirectoryAndFile(): string {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    const initialDeposits: StoredDeposit[] = [
      {
        id: "dep_init_01",
        userId: "usr_koffi_01",
        username: "koffi",
        fullName: "Koffi Mensah",
        email: "koffi@vitaearn.com",
        phone: "+228 90 12 34 56",
        operator: "T-Money (Togocel)",
        amount: 4500,
        currency: "XOF",
        purpose: "Activation de compte",
        status: "succeeded",
        provider: "saspay",
        providerRef: "sp_live_9a7d2e4f",
        confirmationSource: "Paiement automatique confirmé par SasPay",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        confirmedAt: new Date(Date.now() - 3600000 * 24 + 15000).toISOString(),
      },
      {
        id: "dep_init_02",
        userId: "usr_espoir_master",
        username: "espoir",
        fullName: "Espoir Adayi",
        email: "adayiespoir60@gmail.com",
        phone: "+228 90 00 00 00",
        operator: "T-Money (Togocel)",
        amount: 4500,
        currency: "XOF",
        purpose: "Activation de compte",
        status: "succeeded",
        provider: "MANUAL_ADMIN",
        providerRef: "adm_act_master",
        confirmationSource: "Validé manuellement par l'Administrateur",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        confirmedAt: new Date(Date.now() - 3600000 * 48 + 5000).toISOString(),
      },
      {
        id: "dep_init_03",
        userId: "usr_kosqi_02",
        username: "kosqi",
        fullName: "Kosqi",
        email: "akpablikossi999@gmail.com",
        phone: "+228 93 59 73 31",
        operator: "T-Money (Togocel)",
        amount: 4500,
        currency: "XOF",
        purpose: "Activation de compte",
        status: "pending",
        provider: "saspay",
        providerRef: "sp_sess_hefOSYmK",
        confirmationSource: "En attente de règlement SasPay",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        confirmedAt: null,
      },
    ];

    try {
      fs.writeFileSync(filePath, JSON.stringify(initialDeposits, null, 2), "utf-8");
    } catch (err) {
      console.error("Erreur initialisation deposits.json:", err);
    }
  }
  return filePath;
}

export function getAllStoredDeposits(): StoredDeposit[] {
  try {
    const filePath = ensureDirectoryAndFile();
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Erreur lecture deposits.json:", err);
    return [];
  }
}

export function saveStoredDeposit(dep: StoredDeposit): void {
  try {
    const filePath = ensureDirectoryAndFile();
    const deposits = getAllStoredDeposits();
    const idx = deposits.findIndex((d) => d.id === dep.id || (dep.providerRef && d.providerRef === dep.providerRef));

    if (idx >= 0) {
      deposits[idx] = { ...deposits[idx], ...dep };
    } else {
      deposits.unshift(dep);
    }

    fs.writeFileSync(filePath, JSON.stringify(deposits, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture deposits.json:", err);
  }
}

export function updateStoredDepositStatus(params: {
  identifierOrRef: string;
  status: "succeeded" | "pending" | "failed" | "cancelled";
  confirmationSource?: string;
}): boolean {
  try {
    const filePath = ensureDirectoryAndFile();
    const deposits = getAllStoredDeposits();
    const target = deposits.find(
      (d) =>
        d.id === params.identifierOrRef ||
        d.providerRef === params.identifierOrRef ||
        d.userId === params.identifierOrRef ||
        d.username.toLowerCase() === params.identifierOrRef.toLowerCase()
    );

    if (target) {
      target.status = params.status;
      if (params.confirmationSource) {
        target.confirmationSource = params.confirmationSource;
      }
      if (params.status === "succeeded") {
        target.confirmedAt = new Date().toISOString();
      }
      fs.writeFileSync(filePath, JSON.stringify(deposits, null, 2), "utf-8");
      return true;
    }
    return false;
  } catch (err) {
    console.error("Erreur updateStoredDepositStatus:", err);
    return false;
  }
}
