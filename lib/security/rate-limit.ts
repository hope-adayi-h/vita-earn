/**
 * Rate Limiter en mémoire côté serveur (Sliding Window)
 * Conforme au Guide d'Audit des Systèmes de Paiement (Section 8 : Surveillance et anti-abus)
 * Empêche les attaques par force brute (mots de passe, inscriptions massives, retraits concurrents).
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Nettoyage périodique toutes les 10 minutes pour éviter toute fuite mémoire
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredEntries(now: number, maxWindowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  rateLimitStore.forEach((record, key) => {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < maxWindowMs);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Vérifie et consomme un jeton pour une clé donnée dans une fenêtre glissante.
 * @param key Identifiant unique (ex: `login:ip:user@test.com`)
 * @param maxRequests Nombre maximum de requêtes autorisées
 * @param windowSeconds Durée de la fenêtre en secondes
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  purgeExpiredEntries(now, windowMs * 2);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filtrer les requêtes de la fenêtre actuelle
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Limiteur spécifique pour les tentatives de connexion (5 échecs max par 5 minutes)
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const cleanId = identifier.trim().toLowerCase();
  return rateLimit(`login:${cleanId}`, 5, 300);
}

/**
 * Limiteur pour les demandes de retrait (3 demandes max par minute par utilisateur)
 */
export function checkWithdrawalRateLimit(userId: string): RateLimitResult {
  return rateLimit(`withdrawal:${userId}`, 3, 60);
}

/**
 * Limiteur pour les inscriptions (3 inscriptions max par 10 minutes)
 */
export function checkRegisterRateLimit(identifier: string): RateLimitResult {
  return rateLimit(`register:${identifier}`, 3, 600);
}
