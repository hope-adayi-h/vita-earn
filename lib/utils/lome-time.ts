/**
 * Utilitaires pour le calcul de la date et du jour selon le fuseau horaire officiel de Lomé (Africa/Lome, UTC+0)
 * RÈGLE : Calculé STRICTEMENT côté serveur. Jamais à partir de l'heure de l'appareil client.
 */

export interface LomeDateInfo {
  dateStr: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 1 = Lundi, 2 = Mardi, 3 = Mercredi, 4 = Jeudi, 5 = Vendredi, 6 = Samedi, 7 = Dimanche
  dayName: string; // "Lundi", "Mardi", etc.
  dayLabel: string; // "lundi", "mardi", etc.
  isWeekend: boolean; // true si Samedi (6) ou Dimanche (7)
  formattedLongDate: string; // ex: "Vendredi 20 Novembre 2026"
  timeStr: string; // ex: "08:15"
  hour: number; // ex: 21
  minute: number; // ex: 00
  isPast21h: boolean; // true si >= 21h00 Lomé GMT (fermeture automatique quotidienne)
}

const FRENCH_DAYS = [
  "",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

/**
 * Retourne les informations temporelles actuelles de Lomé (Togo)
 */
export function getLomeServerTime(): LomeDateInfo {
  const now = new Date();

  // Formatter pour l'heure et la date dans le fuseau horaire Africa/Lome
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value || "2026";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";
  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;
  const hourNum = parseInt(hour, 10) || 0;
  const minuteNum = parseInt(minute, 10) || 0;
  // RÈGLE COMMERCIALE ABSOLUE : à 21h00 pile (Lomé UTC+0), toutes les tâches sont automatiquement clôturées
  const isPast21h = hourNum >= 21;

  // Jour de la semaine (1 = Lundi, 7 = Dimanche)
  // En UTC, la date de Lomé est identique car Lomé est UTC+0
  const utcDate = new Date(`${dateStr}T12:00:00Z`);
  const rawDay = utcDate.getUTCDay(); // 0 = Dimanche, 1 = Lundi, ... 6 = Samedi
  const dayOfWeek = rawDay === 0 ? 7 : rawDay;

  const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;
  const dayName = FRENCH_DAYS[dayOfWeek] || "Lundi";
  const dayLabel = dayName.toLowerCase();

  const formattedLongDate = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Lome",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return {
    dateStr,
    dayOfWeek,
    dayName,
    dayLabel,
    isWeekend,
    formattedLongDate:
      formattedLongDate.charAt(0).toUpperCase() + formattedLongDate.slice(1),
    timeStr,
    hour: hourNum,
    minute: minuteNum,
    isPast21h,
  };
}

/**
 * Vérifie si une date précise (YYYY-MM-DD) tombe sur un jour ouvrable (lundi à vendredi)
 */
export function isWeekdayDate(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay();
  return day >= 1 && day <= 5;
}

/**
 * Retourne le jour de la semaine d'une date (1 = Lundi, 5 = Vendredi, 6 = Samedi, 7 = Dimanche)
 */
export function getDayOfWeekFromDate(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}
