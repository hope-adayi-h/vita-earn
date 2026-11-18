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
    <div className="fixed inset-0 z-30 overflow-y-auto bg-[#F4F7FB] text-slate-900 flex flex-col font-sans selection:bg-[#0084FF] selection:text-white">
      <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
        {children}
      </div>
    </div>
  );
}
