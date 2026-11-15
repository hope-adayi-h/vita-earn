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

  // 2. Vérification de la session utilisateur
  let isAuthenticated = false;

  // Vérification cookie de session directe (test / session active / coffre persistant)
  const sessionUserCookie = request.cookies.get("vita_session_user")?.value;
  const testRoleCookie = request.cookies.get("vita_test_role")?.value;
  const testUserCookie = request.cookies.get("vita_test_user")?.value;
  const activatedCookie = request.cookies.get("vita_account_activated")?.value;

  if (sessionUserCookie || testRoleCookie || testUserCookie || activatedCookie) {
    isAuthenticated = true;
  }

  // Vérification Supabase si configuré
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
      // Poursuivre avec le résultat des cookies
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
