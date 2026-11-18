"use client";

import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Lock,
  CreditCard,
  Settings,
  ShoppingBag,
} from "lucide-react";

export interface AuditLogItem {
  id: string;
  action: string;
  userName: string;
  userEmail: string;
  entityType?: string;
  createdAt: string;
}

interface JournalClientProps {
  logs: AuditLogItem[];
}

export function JournalClient({ logs }: JournalClientProps) {
  const getActionBadge = (action: string) => {
    if (action.includes("admin_unlocked")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <Lock className="w-3 h-3" />
          Déverrouillage Sas Admin
        </span>
      );
    }
    if (action.includes("withdrawal")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
          <CreditCard className="w-3 h-3" />
          Traitement Retrait
        </span>
      );
    }
    if (action.includes("admin_role")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
          <ShieldAlert className="w-3 h-3" />
          Modification Droits Admin
        </span>
      );
    }
    if (action.includes("product")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          <ShoppingBag className="w-3 h-3" />
          Modération Produit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-emerald-950/40 text-gray-700 dark:text-gray-300">
        <Settings className="w-3 h-3" />
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au tableau de bord</span>
        </Link>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Journal d&apos;Audit & Sécurité (Audit Logs)
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Traçabilité immuable de toutes les opérations d&apos;administration et connexions sécurisées
        </p>
      </div>

      <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl overflow-hidden shadow-xs">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Aucun événement enregistré pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1E2E24]">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-emerald-950/10 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-emerald-950/30 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {log.userName}
                      </span>
                      <span className="text-[11px] text-gray-400">({log.userEmail})</span>
                    </div>
                    {log.entityType && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Cible : <span className="font-mono text-gray-700 dark:text-gray-300">{log.entityType}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400 shrink-0 self-end sm:self-center">
                  {new Date(log.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
