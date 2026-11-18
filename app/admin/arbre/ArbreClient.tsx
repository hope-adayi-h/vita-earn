"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  ArrowLeft,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";

export interface TreeUserNode {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActivated: boolean;
  uplineName?: string;
  l1: Array<{ id: string; name: string; isActivated: boolean; phone: string }>;
  l2: Array<{ id: string; name: string; isActivated: boolean; phone: string }>;
  l3: Array<{ id: string; name: string; isActivated: boolean; phone: string }>;
}

interface ArbreClientProps {
  initialNodes: TreeUserNode[];
}

export function ArbreClient({ initialNodes }: ArbreClientProps) {
  const [selectedId, setSelectedId] = useState<string>(initialNodes[0]?.id || "");
  const [search, setSearch] = useState("");

  const filteredNodes = initialNodes.filter(
    (n) =>
      !search ||
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.email.toLowerCase().includes(search.toLowerCase()) ||
      n.phone.includes(search)
  );

  const activeNode = initialNodes.find((n) => n.id === selectedId) || initialNodes[0];

  const totalTeam =
    (activeNode?.l1.length || 0) +
    (activeNode?.l2.length || 0) +
    (activeNode?.l3.length || 0);

  const totalCommissionsEstimated =
    (activeNode?.l1.filter((f) => f.isActivated).length || 0) * 2000 +
    (activeNode?.l2.filter((f) => f.isActivated).length || 0) * 1000 +
    (activeNode?.l3.filter((f) => f.isActivated).length || 0) * 500;

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
          Arbre d&apos;Affiliation & Analyse de Réseau
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Exploration des lignées de parrainage (3 niveaux légaux) et détection des anomalies
        </p>
      </div>

      {/* Sélecteur de compte */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre pour inspecter son arbre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-xs text-gray-900 dark:text-white focus:outline-hidden focus:border-emerald-500 shadow-xs"
          />
        </div>

        {filteredNodes.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Sélectionner le compte à inspecter"
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs"
          >
            {filteredNodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {activeNode ? (
        <div className="space-y-4">
          {/* Fiche du membre inspecté */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#14500C] to-[#2F7A1A] text-white flex items-center justify-center font-bold text-base">
                {activeNode.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {activeNode.name}
                  </h3>
                  <span className="text-xs text-gray-400">({activeNode.email})</span>
                  {activeNode.isActivated ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      Activé (4 500 F)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      En attente
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Parrain direct : <span className="font-semibold text-gray-800 dark:text-gray-200">{activeNode.uplineName || "Racine (Aucun)"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="text-right">
                <div className="text-gray-400 text-[10px] uppercase">Réseau total</div>
                <div className="text-base text-gray-900 dark:text-white">{totalTeam} filleul(s)</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-[10px] uppercase">Gains générés</div>
                <div className="text-base text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(totalCommissionsEstimated)}
                </div>
              </div>
            </div>
          </div>

          {/* Décomposition par niveau */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Niveau 1 */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E2E24] pb-2">
                <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
                  Niveau 1 (2 000 FCFA)
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                  {activeNode.l1.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {activeNode.l1.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-3 text-center">Aucun filleul direct</p>
                ) : (
                  activeNode.l1.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-emerald-950/20 text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">{m.name}</span>
                      <span className={`text-[10px] font-bold ${m.isActivated ? "text-emerald-600" : "text-gray-400"}`}>
                        {m.isActivated ? "Activé" : "Attente"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Niveau 2 */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E2E24] pb-2">
                <span className="text-xs font-black uppercase text-teal-700 dark:text-teal-400">
                  Niveau 2 (1 000 FCFA)
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700">
                  {activeNode.l2.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {activeNode.l2.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-3 text-center">Aucun filleul N2</p>
                ) : (
                  activeNode.l2.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-emerald-950/20 text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">{m.name}</span>
                      <span className={`text-[10px] font-bold ${m.isActivated ? "text-emerald-600" : "text-gray-400"}`}>
                        {m.isActivated ? "Activé" : "Attente"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Niveau 3 */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E2E24] pb-2">
                <span className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">
                  Niveau 3 (500 FCFA)
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700">
                  {activeNode.l3.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {activeNode.l3.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-3 text-center">Aucun filleul N3</p>
                ) : (
                  activeNode.l3.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-emerald-950/20 text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">{m.name}</span>
                      <span className={`text-[10px] font-bold ${m.isActivated ? "text-emerald-600" : "text-gray-400"}`}>
                        {m.isActivated ? "Activé" : "Attente"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-gray-400 bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24]">
          Aucun utilisateur trouvé.
        </div>
      )}
    </div>
  );
}
