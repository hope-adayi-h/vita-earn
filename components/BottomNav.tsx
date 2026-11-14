"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, PlusCircle, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  // On masque la barre de navigation sur les pages d'authentification et d'activation
  const isHiddenPage = pathname.startsWith("/auth") || pathname.startsWith("/activation");
  if (isHiddenPage) return null;

  const navItems = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Marché", href: "/marche", icon: ShoppingBag },
    { label: "Vendre", href: "/vendre", icon: PlusCircle, isHighlight: true },
    { label: "Portefeuille", href: "/portefeuille", icon: Wallet },
    { label: "Profil", href: "/profil", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-vita-border safe-bottom shadow-lg">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "touch-target flex-col justify-center py-1 transition-colors relative",
                isActive ? "text-vita-deep font-semibold" : "text-vita-muted hover:text-vita-deep"
              )}
            >
              {item.isHighlight ? (
                <div className="w-10 h-10 -mt-4 rounded-full bg-vita-deep text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className={cn("w-5 h-5 mb-0.5", isActive && "text-vita-deep")} />
              )}
              <span className={cn("text-[10px] leading-tight", item.isHighlight && "mt-0.5")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
