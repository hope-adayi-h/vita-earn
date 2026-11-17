import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en Franc CFA (XOF), entiers sans décimales.
 * Conforme à AGENTS.md : entiers, pas de virgule.
 */
export function formatFCFA(amount: number): string {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Retourne l'URL de base de l'application
 */
export function getBaseAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "https://vita-earn.netlify.app";
}
