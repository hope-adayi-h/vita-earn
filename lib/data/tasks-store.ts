import fs from "fs";
import path from "path";
import os from "os";
import type { VideoPlatform } from "@/lib/video/universal-embed";
import { getLomeServerTime, type LomeDateInfo } from "@/lib/utils/lome-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllUsers, findUserByIdentifier } from "@/lib/auth/local-store";

export interface StoredDailyTask {
  id: string;
  dayOfWeek: number; // 1 = Lundi, 2 = Mardi, 3 = Mercredi, 4 = Jeudi, 5 = Vendredi
  specificDate?: string | null; // "YYYY-MM-DD" ou null (récurrent chaque semaine)
  title: string;
  videoUrl: string; // Lien original (stocké côté serveur, jamais affiché au client)
  platform: VideoPlatform;
  embedUrl: string; // URL d'intégration officielle
  videoId?: string;
  instructions: string;
  rewardAmount: number; // FCFA
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredTaskValidation {
  id: string;
  userId: string;
  taskId: string;
  validatedDate: string; // "YYYY-MM-DD" (date Lomé)
  rewardAmount: number;
  createdAt: string;
}

function getDataDir(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_tasks_write");
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

function getTasksFilePath(): string {
  return path.join(getDataDir(), "daily_video_tasks.json");
}

function getValidationsFilePath(): string {
  return path.join(getDataDir(), "daily_task_validations.json");
}

// 5 tâches par défaut pour chaque jour ouvrable
const DEFAULT_TASKS: StoredDailyTask[] = [
  {
    id: "task_lundi",
    dayOfWeek: 1,
    specificDate: null,
    title: "Tâche du Lundi — Découverte & Actualités Tech",
    videoUrl: "https://www.tiktok.com/@tiktok/video/7106594312292453678",
    platform: "tiktok",
    embedUrl: "https://www.tiktok.com/embed/v2/7106594312292453678",
    videoId: "7106594312292453678",
    instructions: "Visionnez attentivement cette courte vidéo partenaire. Dès la fin du visionnage, cliquez sur Valider pour créditer votre solde.",
    rewardAmount: 100,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_mardi",
    dayOfWeek: 2,
    specificDate: null,
    title: "Tâche du Mardi — Formation Stratégies Digitales",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    videoId: "dQw4w9WgXcQ",
    instructions: "Regardez la vidéo de formation du jour pour développer vos compétences. Cliquez sur le bouton de validation pour percevoir votre gain.",
    rewardAmount: 150,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_mercredi",
    dayOfWeek: 3,
    specificDate: null,
    title: "Tâche du Mercredi — Opportunités & E-commerce",
    videoUrl: "https://www.youtube.com/watch?v=L_LUpnjgPso",
    platform: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/L_LUpnjgPso?rel=0&modestbranding=1",
    videoId: "L_LUpnjgPso",
    instructions: "Suivez ce tutoriel pratique sur le commerce en ligne en Afrique de l'Ouest et validez votre récompense journalière.",
    rewardAmount: 100,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_jeudi",
    dayOfWeek: 4,
    specificDate: null,
    title: "Tâche du Jeudi — Astuces Création de Contenu",
    videoUrl: "https://www.tiktok.com/@tiktok/video/7010459312292453678",
    platform: "tiktok",
    embedUrl: "https://www.tiktok.com/embed/v2/7010459312292453678",
    videoId: "7010459312292453678",
    instructions: "Découvrez les meilleures méthodes pour optimiser votre visibilité en ligne et validez votre tâche du jour.",
    rewardAmount: 120,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_vendredi",
    dayOfWeek: 5,
    specificDate: null,
    title: "Tâche du Vendredi — Synthèse & Éducation Financière",
    videoUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    platform: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/fJ9rUzIMcZQ?rel=0&modestbranding=1",
    videoId: "fJ9rUzIMcZQ",
    instructions: "Complétez votre session vidéo de fin de semaine et recevez votre récompense directement sur votre portefeuille.",
    rewardAmount: 150,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
];

function ensureTasksFile(): string {
  const filePath = getTasksFilePath();
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(DEFAULT_TASKS, null, 2), "utf-8");
    } catch {}
  }
  return filePath;
}

function ensureValidationsFile(): string {
  const filePath = getValidationsFilePath();
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
    } catch {}
  }
  return filePath;
}

/**
 * Récupère toutes les tâches vidéo actives et non supprimées
 */
export function getAllStoredDailyTasks(): StoredDailyTask[] {
  try {
    const filePath = ensureTasksFile();
    const content = fs.readFileSync(filePath, "utf-8");
    const tasks = JSON.parse(content) as StoredDailyTask[];
    return tasks.filter((t) => !t.isDeleted);
  } catch {
    return DEFAULT_TASKS;
  }
}

/**
 * Sauvegarde ou modifie une tâche vidéo
 */
export function saveStoredDailyTask(task: Omit<StoredDailyTask, "id" | "createdAt" | "updatedAt"> & { id?: string }): StoredDailyTask {
  const filePath = ensureTasksFile();
  const tasks = getAllStoredDailyTasks();

  const id = task.id || `task_${Date.now()}`;
  const now = new Date().toISOString();

  const existingIndex = tasks.findIndex((t) => t.id === id);
  let savedTask: StoredDailyTask;

  if (existingIndex >= 0) {
    savedTask = {
      ...tasks[existingIndex],
      ...task,
      id,
      updatedAt: now,
    };
    tasks[existingIndex] = savedTask;
  } else {
    savedTask = {
      ...task,
      id,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(savedTask);
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur écriture daily_video_tasks.json:", err);
  }

  return savedTask;
}

/**
 * Active ou désactive une tâche
 */
export function toggleStoredTaskActive(id: string, isActive: boolean): boolean {
  const filePath = ensureTasksFile();
  const tasks = getAllStoredDailyTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;

  task.isActive = isActive;
  task.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Suppression logique (soft-delete) d'une tâche
 */
export function deleteStoredDailyTask(id: string): boolean {
  const filePath = ensureTasksFile();
  const tasks = getAllStoredDailyTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;

  task.isDeleted = true;
  task.isActive = false;
  task.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Trouve la tâche vidéo programmée pour aujourd'hui selon le fuseau horaire de Lomé
 */
export function getTodayTaskForLome(timeInfo?: LomeDateInfo): StoredDailyTask | null {
  const time = timeInfo || getLomeServerTime();

  // Les tâches ne sont JAMAIS disponibles le week-end
  if (time.isWeekend) {
    return null;
  }

  const tasks = getAllStoredDailyTasks();

  // 1. Priorité absolue : tâche avec une date spécifique correspondant exactement à aujourd'hui
  const specificDateTask = tasks.find(
    (t) => t.isActive && !t.isDeleted && t.specificDate === time.dateStr
  );
  if (specificDateTask) {
    return specificDateTask;
  }

  // 2. Sinon : tâche récurrente configurée pour ce jour de la semaine (1=Lundi à 5=Vendredi) sans date spécifique
  const recurringDayTask = tasks.find(
    (t) => t.isActive && !t.isDeleted && !t.specificDate && t.dayOfWeek === time.dayOfWeek
  );

  return recurringDayTask || null;
}

/**
 * Récupère toutes les validations de tâches
 */
export function getAllTaskValidations(): StoredTaskValidation[] {
  try {
    const filePath = ensureValidationsFile();
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as StoredTaskValidation[];
  } catch {
    return [];
  }
}

/**
 * Vérifie si un utilisateur a déjà validé une tâche aujourd'hui (Lomé)
 */
export function hasUserValidatedToday(userId: string, taskId: string, dateStr: string): boolean {
  const validations = getAllTaskValidations();
  const cleanUser = userId.toLowerCase().trim();
  return validations.some(
    (v) =>
      (v.userId.toLowerCase() === cleanUser || v.userId === userId) &&
      v.taskId === taskId &&
      v.validatedDate === dateStr
  );
}

/**
 * Enregistre la validation d'une tâche et crédite immédiatement le portefeuille de l'utilisateur
 */
export function recordStoredTaskValidation(params: {
  userId: string;
  taskId: string;
  rewardAmount: number;
  dateStr: string;
}): { success: boolean; error?: string; reward?: number } {
  const { userId, taskId, rewardAmount, dateStr } = params;

  // 1. Idempotence : vérifier si déjà validée
  if (hasUserValidatedToday(userId, taskId, dateStr)) {
    return { success: false, error: "Vous avez déjà validé cette tâche aujourd'hui." };
  }

  const filePath = ensureValidationsFile();
  const validations = getAllTaskValidations();

  const newValidation: StoredTaskValidation = {
    id: `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    taskId,
    validatedDate: dateStr,
    rewardAmount,
    createdAt: new Date().toISOString(),
  };

  validations.push(newValidation);

  try {
    fs.writeFileSync(filePath, JSON.stringify(validations, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur enregistrement validation:", err);
    return { success: false, error: "Erreur d'enregistrement." };
  }

  // 2. Créditer immédiatement le solde et le profit de l'utilisateur dans le local store
  try {
    const users = getAllUsers();
    const cleanUser = userId.toLowerCase().trim();
    const targetUser = users.find(
      (u) =>
        u.id.toLowerCase() === cleanUser ||
        u.username.toLowerCase() === cleanUser ||
        u.email.toLowerCase() === cleanUser
    );

    if (targetUser) {
      targetUser.balance = (targetUser.balance || 0) + rewardAmount;
      targetUser.profit = (targetUser.profit || 0) + rewardAmount;

      const usersFilePath = path.join(getDataDir(), "registered_users.json");
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Erreur crédit solde utilisateur:", err);
  }

  return { success: true, reward: rewardAmount };
}
