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
  let currentUser: {
    email?: string | null;
    name?: string | null;
    isActivated?: boolean;
    role?: string;
  } | null = null;

  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }

  const testRole = cookieStore.get("vita_test_role")?.value || sessionUser?.role;
  const testEmail = cookieStore.get("vita_test_email")?.value || sessionUser?.email;
  const testUser = cookieStore.get("vita_test_user")?.value || sessionUser?.username;

  if (sessionUser) {
    currentUser = {
      email: sessionUser.email,
      name: sessionUser.username || sessionUser.fullName,
      isActivated: Boolean(sessionUser.isActivated),
      role: sessionUser.role || "user",
    };
  } else if (testRole) {
    currentUser = {
      email: testEmail || (testRole === "admin" ? "admin@vitaearn.com" : "membre@vitaearn.com"),
      name: testUser || (testRole === "admin" ? "Administrateur" : "Membre"),
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
        .select("is_activated, role, full_name")
        .eq("id", user.id)
        .single();

      currentUser = {
        email: user.email,
        name: profile?.full_name || sessionUser?.username || user.user_metadata?.username || user.email?.split("@")[0],
        isActivated: Boolean(profile?.is_activated ?? sessionUser?.isActivated),
        role: profile?.role || testRole || "user",
      };
    }
  } catch {
    // Si l'environnement de dev n'est pas encore configuré avec Supabase, ne pas bloquer l'affichage
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
