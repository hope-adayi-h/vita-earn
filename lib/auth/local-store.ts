import fs from "fs";
import path from "path";

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

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "registered_users.json");

function ensureDirectoryAndFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    // Initialiser avec des utilisateurs de démonstration si absent
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
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
  }
}

export function getAllUsers(): StoredUser[] {
  try {
    ensureDirectoryAndFile();
    const content = fs.readFileSync(USERS_FILE, "utf-8");
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
    ensureDirectoryAndFile();
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

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture registered_users.json:", err);
  }
}

export function activateUser(identifierOrId: string): StoredUser | null {
  try {
    ensureDirectoryAndFile();
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
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
      return user;
    }
    return null;
  } catch (err) {
    console.error("Erreur activation user:", err);
    return null;
  }
}
