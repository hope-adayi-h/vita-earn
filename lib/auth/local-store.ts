import fs from "fs";
import path from "path";
import os from "os";

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  password?: string;
  upline?: string | null;
  role: string;
  isActivated: boolean;
  isBanned?: boolean;
  bannedReason?: string;
  referralCode?: string;
  balance?: number;
  points?: number;
  profit?: number;
  createdAt: string;
}

// Détection du répertoire de stockage persistant (supporte dev local et serverless Netlify / AWS Lambda)
function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_write");
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
  return path.join(dir, "registered_users.json");
}

function ensureDirectoryAndFile(): string {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    const bundledPath = path.join(process.cwd(), "data", "registered_users.json");
    if (fs.existsSync(bundledPath)) {
      try {
        fs.copyFileSync(bundledPath, filePath);
        return filePath;
      } catch {}
    }

    // Utilisateurs par défaut
    const initialUsers: StoredUser[] = [
      {
        id: "usr_espoir_master",
        username: "Espoir",
        email: "adayiespoir60@gmail.com",
        phone: "+228 90 00 00 00",
        country: "TG",
        password: "Espoir@Vita2026!",
        role: "admin",
        isActivated: true,
        referralCode: "VE-ESPOIR",
        balance: 3500,
        profit: 3500,
        points: 3500,
        createdAt: "2026-11-18T00:00:00.000Z",
      },
      {
        id: "usr_kosqi_sample",
        username: "Kosqi",
        email: "akpablikossi999@gmail.com",
        phone: "+228 93597331",
        country: "TG",
        password: "Password123!",
        role: "user",
        isActivated: false,
        upline: "Espoir",
        referralCode: "VE-KOSQI",
        balance: 0,
        profit: 0,
        points: 0,
        createdAt: "2026-11-18T10:00:00.000Z",
      },
      {
        id: "usr_koffi_active",
        username: "Koffi",
        email: "koffi@vitaearn.com",
        phone: "+228 91 22 33 44",
        country: "TG",
        password: "Password123!",
        role: "user",
        isActivated: true,
        upline: "Espoir",
        referralCode: "VE-KOFFI",
        balance: 4500,
        profit: 2000,
        points: 2000,
        createdAt: "2026-11-17T14:30:00.000Z",
      },
    ];
    try {
      fs.writeFileSync(filePath, JSON.stringify(initialUsers, null, 2), "utf-8");
    } catch {}
  }
  return filePath;
}

export function getAllUsers(): StoredUser[] {
  try {
    const filePath = ensureDirectoryAndFile();
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as StoredUser[];
  } catch (err) {
    console.error("Erreur lecture registered_users.json:", err);
    return [];
  }
}

export function findUserByIdentifier(identifier: string): StoredUser | null {
  const clean = identifier.toLowerCase().trim();
  const users = getAllUsers();
  return (
    users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        (u.phone && u.phone.replace(/\s+/g, "") === clean.replace(/\s+/g, ""))
    ) || null
  );
}

export function saveUser(user: StoredUser): void {
  try {
    const filePath = ensureDirectoryAndFile();
    const users = getAllUsers();
    const existingIndex = users.findIndex(
      (u) =>
        u.id === user.id ||
        u.username.toLowerCase() === user.username.toLowerCase() ||
        u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture registered_users.json:", err);
  }
}

export function activateUser(identifierOrId: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.isActivated = true;
      user.isBanned = false;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur activation user:", err);
    return null;
  }
}

export function deactivateUser(identifierOrId: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.isActivated = false;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur désactivation user:", err);
    return null;
  }
}

export function banUser(identifierOrId: string, reason?: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.isBanned = true;
      user.bannedReason = reason || "Compte suspendu par l'administrateur.";
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur bannissement user:", err);
    return null;
  }
}

export function unbanUser(identifierOrId: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.isBanned = false;
      user.bannedReason = undefined;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur réhabilitation user:", err);
    return null;
  }
}

export function updateUserPassword(identifierOrId: string, newPassword: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.password = newPassword;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur mise à jour mot de passe user:", err);
    return null;
  }
}

export function updateUserPhone(identifierOrId: string, newPhone: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.phone = newPhone;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur mise à jour téléphone user:", err);
    return null;
  }
}

export function updateUserUpline(identifierOrId: string, newUpline: string): StoredUser | null {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean
    );

    if (user) {
      user.upline = newUpline;
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur mise à jour parrain user:", err);
    return null;
  }
}

export function deleteUser(identifierOrId: string): boolean {
  try {
    const filePath = ensureDirectoryAndFile();
    const clean = identifierOrId.toLowerCase().trim();
    const users = getAllUsers();
    const filtered = users.filter(
      (u) =>
        u.id.toLowerCase() !== clean &&
        u.username.toLowerCase() !== clean &&
        u.email.toLowerCase() !== clean
    );

    if (filtered.length !== users.length) {
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), "utf-8");
      return true;
    }
    return false;
  } catch (err) {
    console.error("Erreur suppression user:", err);
    return false;
  }
}
