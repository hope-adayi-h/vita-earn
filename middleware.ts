import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const path = request.nextUrl.pathname;

  // 1. Routes publiques exemptées (API, ressources statiques)
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/images/") ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 1b. Routes publiques d'authentification
  const isAuthPath =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/forgot-password") ||
    path.startsWith("/auth/reset-password") ||
    path.startsWith("/auth/callback");

  // 2. Vérification de la session utilisateur sécurisée (source de vérité Supabase JWT)
  let isAuthenticated = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    !supabaseUrl.includes("placeholder") &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes("placeholder")
  ) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        isAuthenticated = true;
      }
    } catch {
      // Échec fermé
    }
  } else {
    // Mode local de secours si Supabase n'est pas encore configuré
    const sessionUserCookie = request.cookies.get("vita_session_user")?.value;
    if (sessionUserCookie) {
      isAuthenticated = true;
    }
  }

  // RÈGLE P0 : Les routes /admin nécessitent formellement une authentification vérifiée
  if (path.startsWith("/admin") && !isAuthenticated) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // RÈGLE P0 : Sas de déverrouillage Administrateur obligatoire (Face ID / Code Secret)
  if (path.startsWith("/admin") && path !== "/admin/lock") {
    const adminUnlockCookie = request.cookies.get("vita_admin_unlocked")?.value;
    if (!adminUnlockCookie) {
      const lockUrl = new URL("/admin/lock", request.url);
      return NextResponse.redirect(lockUrl);
    }
  }

  // 3. Si l'utilisateur n'est PAS connecté et tente d'accéder à une page protégée
  // (Tableau de bord /, Portefeuille, Vendre, Profil, Tâches, Admin, etc.)
  if (!isAuthenticated && !isAuthPath) {
    const redirectUrl = new URL("/auth/login", request.url);
    if (path !== "/") {
      redirectUrl.searchParams.set("redirect", path);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Si l'utilisateur EST déjà connecté et visite /auth/login ou /auth/register
  if (isAuthenticated && (path === "/auth/login" || path === "/auth/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.png, .jpg, .webp, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
