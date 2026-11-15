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
        id: "demo_koffi",
        username: "Koffi",
        email: "koffi@vitaearn.com",
        phone: "+228 90 12 34 56",
        country: "Togo",
        password: "koffi",
        role: "user",
        isActivated: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo_admin",
        username: "Administrateur",
        email: "admin@vitaearn.com",
        phone: "+228 91 00 00 00",
        country: "Togo",
        password: "admin",
        role: "admin",
        isActivated: true,
        createdAt: new Date().toISOString(),
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
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur activation user:", err);
    return null;
  }
}
