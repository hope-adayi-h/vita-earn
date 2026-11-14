import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vita Earn — Marketplace & Portefeuille Mobile Money (Afrique de l'Ouest)",
  description:
    "Place de marché moderne pour produits physiques et digitaux, portefeuille et retraits Mobile Money (T-Money, Flooz) pour le Togo et l'Afrique de l'Ouest.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Récupération de l'utilisateur connecté côté serveur (règle absolue : getUser())
  let currentUser: { email?: string | null; isActivated?: boolean; role?: string } | null = null;

  const cookieStore = cookies();
  const testRole = cookieStore.get("vita_test_role")?.value;
  const testEmail = cookieStore.get("vita_test_email")?.value;

  if (testRole) {
    currentUser = {
      email: testEmail || (testRole === "admin" ? "admin@vitaearn.com" : "koffi@vitaearn.com"),
      isActivated: true,
      role: testRole,
    };
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_activated, role")
        .eq("id", user.id)
        .single();

      currentUser = {
        email: user.email,
        isActivated: Boolean(profile?.is_activated),
        role: profile?.role || testRole,
      };
    }
  } catch {
    // Si l'environnement de dev n'est pas encore configuré avec Supabase, ne pas bloquer l'affichage
  }

  // Par défaut sur la plateforme, l'utilisateur du tableau de bord est considéré comme membre inscrit
  if (!currentUser) {
    currentUser = {
      email: "koffi@vitaearn.com",
      isActivated: false,
      role: "user",
    };
  }

  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-vita-surface text-vita-text antialiased pb-20 md:pb-0">
        <Navbar user={currentUser} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
