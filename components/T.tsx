"use client";

import { useApp } from "@/context/AppContext";

interface TProps {
  k: string;
  fallback?: string;
}

export function T({ k, fallback }: TProps) {
  const { t } = useApp();
  return <>{t(k) || fallback || k}</>;
}
