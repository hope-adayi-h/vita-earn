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
  cleanUrl?: string;
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
    embedUrl: "https://www.tiktok.com/player/v1/7106594312292453678?music_info=1&description=1",
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

// Cache mémoire pour optimiser la réactivité serverless
let inMemoryTasksCache: StoredDailyTask[] | null = null;
let lastSupabaseSyncTime = 0;

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
 * Sauvegarde synchrone dans le fichier local
 */
function writeTasksToFile(tasks: StoredDailyTask[]): void {
  try {
    const filePath = ensureTasksFile();
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf-8");
    inMemoryTasksCache = tasks;
  } catch (err) {
    console.error("Erreur écriture daily_video_tasks.json:", err);
  }
}

/**
 * Sauvegarde asynchrone dans la table platform_settings de Supabase
 */
export async function syncTasksToSupabase(tasks: StoredDailyTask[]): Promise<void> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert({
        key: "daily_tasks",
        value: tasks,
        description: "Planning hebdomadaire des 5 tâches quotidiennes et statut d'activation",
        updated_at: new Date().toISOString(),
      });
      lastSupabaseSyncTime = Date.now();
    }
  } catch (err) {
    console.error("Erreur synchronisation daily_tasks dans platform_settings:", err);
  }
}

/**
 * Applique la règle de fermeture automatique à 21h00 Lomé GMT
 * Ne désactive pas de force les tâches sauvegardées par l'administrateur
 */
function applyNightAutoDeactivation(tasks: StoredDailyTask[]): {
  tasks: StoredDailyTask[];
  modified: boolean;
} {
  return { tasks, modified: false };
}

/**
 * Récupère toutes les tâches vidéo actives et non supprimées
 * Synchronise avec Supabase et le fichier local
 */
export function getAllStoredDailyTasks(): StoredDailyTask[] {
  // 1. Lire depuis le fichier local
  let currentTasks: StoredDailyTask[] = DEFAULT_TASKS;
  try {
    const filePath = ensureTasksFile();
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as StoredDailyTask[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      currentTasks = parsed.filter((t) => !t.isDeleted);
    }
  } catch {}

  // 2. Vérifier la clôture automatique de 21h00
  const { tasks: verifiedTasks, modified } = applyNightAutoDeactivation(currentTasks);
  if (modified) {
    writeTasksToFile(verifiedTasks);
    // Sync async vers Supabase en arrière-plan
    syncTasksToSupabase(verifiedTasks).catch(() => {});
  }

  return verifiedTasks;
}

/**
 * Récupère les tâches avec synchronisation Supabase en temps réel (pour les Server Components et Server Actions)
 */
export async function fetchAndSyncDailyTasks(): Promise<StoredDailyTask[]> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "daily_tasks")
        .maybeSingle();

      if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
        const dbTasks = data.value as StoredDailyTask[];
        const filtered = dbTasks.filter((t) => !t.isDeleted);

        // Appliquer la règle de 21h00
        const { tasks: finalTasks, modified } = applyNightAutoDeactivation(filtered);
        writeTasksToFile(finalTasks);
        if (modified) {
          syncTasksToSupabase(finalTasks).catch(() => {});
        }
        return finalTasks;
      }
    }
  } catch (err) {
    console.warn("Fallback lecture daily_tasks depuis Supabase:", err);
  }

  return getAllStoredDailyTasks();
}

/**
 * Sauvegarde ou modifie une tâche vidéo
 */
export function saveStoredDailyTask(
  task: Omit<StoredDailyTask, "id" | "createdAt" | "updatedAt"> & { id?: string }
): StoredDailyTask {
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

  writeTasksToFile(tasks);
  syncTasksToSupabase(tasks).catch(() => {});

  return savedTask;
}

/**
 * Active ou désactive une tâche spécifique (Action en 1 clic pour l'admin)
 */
export function toggleStoredTaskActive(id: string, isActive: boolean): boolean {
  const tasks = getAllStoredDailyTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;

  task.isActive = isActive;
  task.updatedAt = new Date().toISOString();

  writeTasksToFile(tasks);
  syncTasksToSupabase(tasks).catch(() => {});

  return true;
}

/**
 * Active ou désactive TOUTES les tâches de la semaine en un seul clic
 */
export function toggleAllStoredTasksActive(isActive: boolean): boolean {
  const tasks = getAllStoredDailyTasks();
  const now = new Date().toISOString();

  for (const t of tasks) {
    t.isActive = isActive;
    t.updatedAt = now;
  }

  writeTasksToFile(tasks);
  syncTasksToSupabase(tasks).catch(() => {});

  return true;
}

/**
 * Suppression logique (soft-delete) d'une tâche
 */
export function deleteStoredDailyTask(id: string): boolean {
  const tasks = getAllStoredDailyTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;

  task.isDeleted = true;
  task.isActive = false;
  task.updatedAt = new Date().toISOString();

  writeTasksToFile(tasks);
  syncTasksToSupabase(tasks).catch(() => {});

  return true;
}

/**
 * Trouve la tâche programmée selon le fuseau horaire de Lomé
 * RÈGLE ABSOLUE :
 * 1. Priorité absolue : tâche active (isActive=true) activée par l'administrateur
 *    (s'affiche immédiatement pour les membres afin de permettre les tests et l'exécution)
 * 2. Si aucune tâche n'est activement programmée par l'administrateur, respect des règles
 *    de fermeture du week-end et de 21h00 GMT.
 */
export function getTodayTaskForLome(
  timeInfo?: LomeDateInfo,
  customTasks?: StoredDailyTask[]
): StoredDailyTask | null {
  const time = timeInfo || getLomeServerTime();
  const tasks = customTasks && customTasks.length > 0 ? customTasks : getAllStoredDailyTasks();

  // 1. Tâche avec une date spécifique correspondant exactement à aujourd'hui
  const specificDateTask = tasks.find(
    (t) => t.isActive && !t.isDeleted && t.specificDate === time.dateStr
  );
  if (specificDateTask) {
    return specificDateTask;
  }

  // 2. Tâche récurrente configurée pour ce jour de la semaine
  const recurringDayTask = tasks.find(
    (t) => t.isActive && !t.isDeleted && !t.specificDate && t.dayOfWeek === time.dayOfWeek
  );
  if (recurringDayTask) {
    return recurringDayTask;
  }

  // 3. PRIORITÉ ADMIN EN DIRECT : Si l'administrateur a explicitement activé une tâche (isActive=true, non supprimée)
  // (ex: Vidéo TikTok activée en direct depuis l'admin), elle est retournée immédiatement aux utilisateurs
  // même le week-end ou un autre jour, pour permettre la validation et la rémunération !
  const explicitlyActiveTask = tasks.find((t) => t.isActive && !t.isDeleted);
  if (explicitlyActiveTask) {
    return explicitlyActiveTask;
  }

  // 4. Si aucune tâche n'est activée manuellement par l'admin, respecter les règles automatiques :
  if (time.isWeekend || time.isPast21h) {
    return null;
  }

  return null;
}

/**
 * Retourne TOUTES les tâches actuellement activées par l'administrateur (1 à 5 tâches)
 * Permet à l'admin d'activer 1, 2, ou toutes les 5 tâches dans une même journée,
 * quel que soit le jour choisi.
 */
export function getActiveTasksForLome(
  _timeInfo?: LomeDateInfo,
  customTasks?: StoredDailyTask[]
): StoredDailyTask[] {
  const tasks = customTasks && customTasks.length > 0 ? customTasks : getAllStoredDailyTasks();
  return tasks
    .filter((t) => t.isActive && !t.isDeleted)
    .sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));
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
 * Normalise les identifiants et types de tâches pour l'anti-doublon universel
 */
export function normalizeTaskAliases(taskIdOrType: string): string[] {
  const t = (taskIdOrType || "").toLowerCase().trim();
  if (t === "task_lundi" || t === "trivia" || t === "quiz" || t === "task_trivia" || t === "task_quiz") {
    return ["task_lundi", "trivia", "quiz", "task_trivia", "task_quiz"];
  }
  if (t === "task_mardi" || t === "tiktok" || t === "task_tiktok") {
    return ["task_mardi", "tiktok", "task_tiktok"];
  }
  if (t === "task_mercredi" || t === "youtube" || t === "task_youtube") {
    return ["task_mercredi", "youtube", "task_youtube"];
  }
  if (t === "task_jeudi" || t === "ads" || t === "adsense" || t === "task_ads" || t === "task_adsense") {
    return ["task_jeudi", "ads", "adsense", "task_ads", "task_adsense"];
  }
  if (t === "task_vendredi" || t === "instagram" || t === "task_instagram") {
    return ["task_vendredi", "instagram", "task_instagram"];
  }
  return [t];
}

/**
 * Vérifie si un utilisateur a déjà validé une tâche aujourd'hui (Lomé)
 * RÈGLE ABSOLUE ANTI-DOUBLON : synchronise immédiatement les identifiants
 * Dashboard (ex: tiktok) et Page Tâches (ex: task_mardi)
 */
export function hasUserValidatedToday(userId: string, taskId: string, dateStr: string): boolean {
  if (!userId || !taskId) return false;
  const validations = getAllTaskValidations();
  const cleanUser = userId.toLowerCase().trim();
  const aliases = normalizeTaskAliases(taskId);

  return validations.some((v) => {
    const userMatches =
      v.userId === userId ||
      v.userId.toLowerCase().trim() === cleanUser;

    if (!userMatches) return false;

    const dateMatches =
      v.validatedDate === dateStr ||
      (dateStr && v.validatedDate && v.validatedDate.startsWith(dateStr.slice(0, 10)));

    if (!dateMatches) return false;

    const vTask = (v.taskId || "").toLowerCase().trim();
    return aliases.includes(vTask);
  });
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

  // 2. Note : les gains vidéo et publicités sont cloisonnés dans leur propre cagnotte
  // et ne modifient pas directement le solde principal. Seul le quiz crédite le solde principal.

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
