import fs from "fs";
import path from "path";
import os from "os";
import type { VideoPlatform } from "@/lib/video/universal-embed";
import { getLomeServerTime, type LomeDateInfo } from "@/lib/utils/lome-time";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllUsers, findUserByIdentifier } from "@/lib/auth/local-store";

export type DailyTaskType = "quiz" | "tiktok" | "youtube" | "adsense" | "instagram";

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[]; // au moins 3 ou 4 options par question
  correctOptionIndex: number; // index (0, 1, 2...)
  rewardAmount: number; // Récompense en FCFA pour cette réponse
}

export interface StoredDailyTask {
  id: string;
  dayOfWeek: number; // 1 = Lundi, 2 = Mardi, 3 = Mercredi, 4 = Jeudi, 5 = Vendredi
  specificDate?: string | null; // "YYYY-MM-DD" ou null (récurrent chaque semaine)
  taskType: DailyTaskType;
  title: string;
  instructions: string;
  rewardAmount: number; // FCFA
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  // Lundi : Quiz & Questionnaires
  quizQuestions?: QuizQuestionItem[];

  // Vidéos (Mardi: TikTok, Mercredi: YouTube, Vendredi: Instagram)
  videoUrl?: string;
  platform?: VideoPlatform;
  embedUrl?: string;
  videoId?: string;
  videoDurationSeconds?: number;

  // Jeudi : Publicité photo AdSense
  adImageUrl?: string;
  adTargetUrl?: string;
  adDurationSeconds?: number; // secondes à rester sur la photo
  sponsorName?: string;
}

export interface StoredTaskValidation {
  id: string;
  userId: string;
  taskId: string;
  validatedDate: string; // "YYYY-MM-DD" (date Lomé)
  rewardAmount: number;
  score?: number;
  totalQuestions?: number;
  status?: "success" | "failed";
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

// 5 tâches fixes et ordonnées pour chaque jour ouvrable (Lundi à Vendredi)
const DEFAULT_TASKS: StoredDailyTask[] = [
  {
    id: "task_lundi",
    dayOfWeek: 1,
    specificDate: null,
    taskType: "quiz",
    title: "Questionnaire du Lundi — Connaissances Digitales & E-commerce",
    instructions:
      "Répondez avec précision aux questions ci-dessous. Attention : vous ne disposez que d'une seule tentative pour valider votre tâche du lundi !",
    rewardAmount: 300,
    isActive: true,
    isDeleted: false,
    quizQuestions: [
      {
        id: "q1",
        question: "Quel est le moyen de paiement Mobile Money officiel le plus répandu au Togo ?",
        options: ["T-Money & Moov Flooz", "PayPal International", "Chèque de banque", "Carte American Express"],
        correctOptionIndex: 0,
        rewardAmount: 100,
      },
      {
        id: "q2",
        question: "Sur Vita Earn, quel est le montant des frais fixes appliqués à chaque demande de retrait ?",
        options: ["1 500 FCFA", "500 FCFA", "10 % du montant", "Gratuit sans frais"],
        correctOptionIndex: 1,
        rewardAmount: 100,
      },
      {
        id: "q3",
        question: "Quel jour de la semaine est dédié aux annonces visuelles AdSense sur Vita Earn ?",
        options: ["Lundi", "Mercredi", "Jeudi", "Dimanche"],
        correctOptionIndex: 2,
        rewardAmount: 100,
      },
    ],
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_mardi",
    dayOfWeek: 2,
    specificDate: null,
    taskType: "tiktok",
    title: "Tâche Vidéo TikTok du Mardi — Création de Contenu Viral",
    videoUrl: "https://www.tiktok.com/@tiktok/video/7106594312292453678",
    platform: "tiktok",
    embedUrl: "https://www.tiktok.com/embed/v2/7106594312292453678",
    videoId: "7106594312292453678",
    instructions:
      "Visionnez la vidéo TikTok de formation partenaire pendant au moins 30 secondes. Cliquez ensuite sur Valider pour créditer votre solde.",
    rewardAmount: 150,
    videoDurationSeconds: 30,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_mercredi",
    dayOfWeek: 3,
    specificDate: null,
    taskType: "youtube",
    title: "Tâche Vidéo YouTube du Mercredi — Stratégies E-Commerce Afrique",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    videoId: "dQw4w9WgXcQ",
    instructions:
      "Suivez ce tutoriel pratique sur YouTube pendant au moins 45 secondes pour perfectionner vos compétences commerciales et percevoir votre gain.",
    rewardAmount: 150,
    videoDurationSeconds: 45,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_jeudi",
    dayOfWeek: 4,
    specificDate: null,
    taskType: "adsense",
    title: "Publicité AdSense du Jeudi — Sponsor & Partenaire Officiel",
    instructions:
      "Examinez attentivement l'annonce publicitaire ci-dessous. Vous devez rester sur la publicité jusqu'à la fin complète du compte à rebours pour débloquer votre gain.",
    rewardAmount: 200,
    adImageUrl:
      "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80",
    adTargetUrl: "https://vita-earn.netlify.app/marche",
    sponsorName: "Vita Commerce — Boutique Sponsorisée UEMOA",
    adDurationSeconds: 15,
    isActive: true,
    isDeleted: false,
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
  },
  {
    id: "task_vendredi",
    dayOfWeek: 5,
    specificDate: null,
    taskType: "instagram",
    title: "Tâche Vidéo Instagram du Vendredi — Clôture & Inspiration",
    videoUrl: "https://www.instagram.com/reel/C8qFmZ0yYV_/",
    platform: "instagram",
    embedUrl: "https://www.instagram.com/reel/C8qFmZ0yYV_/embed",
    instructions:
      "Regardez cette vidéo Instagram partenaire pour vous inspirer et clôturer votre semaine d'activités, puis confirmez votre récompense journalière.",
    rewardAmount: 200,
    videoDurationSeconds: 30,
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

/**
 * Valide la soumission d'un questionnaire (Lundi) avec règle stricte de tentative unique
 */
export function recordQuizSubmission(params: {
  userId: string;
  taskId: string;
  dateStr: string;
  answers: Record<string, number>; // questionId -> optionIndex choisi
}): {
  success: boolean;
  error?: string;
  earnedReward: number;
  correctCount: number;
  totalQuestions: number;
  failedQuestion?: boolean;
} {
  const { userId, taskId, dateStr, answers } = params;

  // 1. Idempotence : une seule tentative par utilisateur et par date
  if (hasUserValidatedToday(userId, taskId, dateStr)) {
    return {
      success: false,
      error: "Vous avez déjà tenté le questionnaire d'aujourd'hui. Une seule tentative autorisée chaque lundi.",
      earnedReward: 0,
      correctCount: 0,
      totalQuestions: 0,
    };
  }

  const tasks = getAllStoredDailyTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.quizQuestions || task.quizQuestions.length === 0) {
    return {
      success: false,
      error: "Questionnaire introuvable ou vide.",
      earnedReward: 0,
      correctCount: 0,
      totalQuestions: 0,
    };
  }

  const totalQuestions = task.quizQuestions.length;
  let correctCount = 0;
  let earnedReward = 0;
  let failedQuestion = false;

  for (const q of task.quizQuestions) {
    const selected = answers[q.id];
    if (selected === q.correctOptionIndex) {
      correctCount++;
      earnedReward += q.rewardAmount || Math.round(task.rewardAmount / totalQuestions);
    } else {
      failedQuestion = true;
    }
  }

  // 2. Enregistrer la validation (empêche toute nouvelle tentative aujourd'hui)
  const filePath = ensureValidationsFile();
  const validations = getAllTaskValidations();

  const newValidation: StoredTaskValidation = {
    id: `val_quiz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    taskId,
    validatedDate: dateStr,
    rewardAmount: earnedReward,
    score: correctCount,
    totalQuestions,
    status: failedQuestion && correctCount === 0 ? "failed" : "success",
    createdAt: new Date().toISOString(),
  };

  validations.push(newValidation);

  try {
    fs.writeFileSync(filePath, JSON.stringify(validations, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur enregistrement validation quiz:", err);
  }

  // 3. Créditer le solde si des réponses sont correctes
  if (earnedReward > 0) {
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
        targetUser.balance = (targetUser.balance || 0) + earnedReward;
        targetUser.profit = (targetUser.profit || 0) + earnedReward;

        const usersFilePath = path.join(getDataDir(), "registered_users.json");
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
      }
    } catch (err) {
      console.error("Erreur crédit solde utilisateur quiz:", err);
    }
  }

  return {
    success: true,
    earnedReward,
    correctCount,
    totalQuestions,
    failedQuestion,
  };
}
