"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="w-full py-6 text-center text-xs text-[#5B6B60] dark:text-[#94A3B8] tracking-wide select-none transition-colors">
      <p>{t("footer.copyright")}</p>
    </footer>
  );
}
