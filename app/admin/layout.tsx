import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Console d'Administration — Vita Earn Command Center",
  description: "Portail exécutif confidentiel et supervision financière Vita Earn.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-[#070D18] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <div className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
        {children}
      </div>
    </div>
  );
}
