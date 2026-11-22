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

  // 1b. Toujours autoriser les Server Actions Next.js sans redirection
  const isServerAction = request.headers.has("next-action");
  if (isServerAction) {
    return response;
  }

  // =========================================================================
  // GESTION PRIORITAIRE DES LIENS DE PARRAINAGE (/register/:username ou /register)
  // =========================================================================
  if (path.startsWith("/register/") || path === "/register") {
    let sponsorName = "";

    if (path.startsWith("/register/")) {
      const raw = path.replace("/register/", "").split("/")[0].trim();
      if (raw) {
        sponsorName = decodeURIComponent(raw).replace(/^@/, "").trim();
      }
    }

    if (!sponsorName && path === "/register") {
      const refParam =
        request.nextUrl.searchParams.get("sponsor") ||
        request.nextUrl.searchParams.get("ref") ||
        request.nextUrl.searchParams.get("upline");
      if (refParam) {
        sponsorName = refParam.replace(/^@/, "").trim();
      }
    }

    const registerUrl = new URL("/auth/register", request.url);
    if (sponsorName) {
      registerUrl.searchParams.set("sponsor", sponsorName);
    }

    const redirectRes = NextResponse.redirect(registerUrl);
    if (sponsorName) {
      redirectRes.cookies.set("vita_pending_sponsor", sponsorName, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // Mémorisé 30 jours
        sameSite: "lax",
      });
    }
    return redirectRes;
  }

  // 1c. Routes publiques d'authentification et d'inscription
  const isAuthPath =
    path.startsWith("/auth/") ||
    path.startsWith("/register") ||
    path === "/activation" ||
    path.startsWith("/marche");

  // Rétention du parrain sur /auth/register
  if (path === "/auth/register") {
    const urlSponsor =
      request.nextUrl.searchParams.get("sponsor") ||
      request.nextUrl.searchParams.get("ref") ||
      request.nextUrl.searchParams.get("upline");

    if (urlSponsor) {
      const clean = urlSponsor.replace(/^@/, "").trim();
      response.cookies.set("vita_pending_sponsor", clean, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    } else {
      // Si l'URL n'a pas de parrain mais que le cookie mémorisé existe, le réinjecter
      const savedSponsor = request.cookies.get("vita_pending_sponsor")?.value;
      if (savedSponsor) {
        const withSponsorUrl = new URL("/auth/register", request.url);
        withSponsorUrl.searchParams.set("sponsor", savedSponsor);
        return NextResponse.redirect(withSponsorUrl);
      }
    }
  }

  // 2. Vérification rapide et optimisée de la session utilisateur
  let isAuthenticated = false;
  let sessionUserObj: any = null;

  // Optimisation P0 : Vérification instantanée des cookies locaux sans appel réseau bloquant
  const sessionUserCookie = request.cookies.get("vita_session_user")?.value;
  if (sessionUserCookie) {
    try {
      sessionUserObj = JSON.parse(sessionUserCookie);
      if (sessionUserObj?.id || sessionUserObj?.username || sessionUserObj?.email) {
        isAuthenticated = true;
      }
    } catch {
      try {
        sessionUserObj = JSON.parse(decodeURIComponent(sessionUserCookie));
        if (sessionUserObj?.id || sessionUserObj?.username || sessionUserObj?.email) {
          isAuthenticated = true;
        }
      } catch {}
    }
  }

  const testUser = request.cookies.get("vita_test_user")?.value;
  const testEmail = request.cookies.get("vita_test_email")?.value;
  const testRole = request.cookies.get("vita_test_role")?.value;
  const adminUnlockCookie = request.cookies.get("vita_admin_unlocked")?.value;
  const isAccountActivated = request.cookies.get("vita_account_activated")?.value === "true";

  if (testUser || testEmail || testRole || adminUnlockCookie || isAccountActivated) {
    isAuthenticated = true;
  }

  const isLoggedOut = request.cookies.get("vita_logged_out")?.value === "true";

  // Restauration de session depuis le coffre persistant vita_accounts (365 jours) si pas de déconnexion volontaire
  const rawAccounts = !isLoggedOut ? request.cookies.get("vita_accounts")?.value : null;
  if (rawAccounts) {
    try {
      const parsedAccounts = JSON.parse(rawAccounts);
      if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
        const latest = parsedAccounts[parsedAccounts.length - 1];
        if (latest?.id || latest?.username || latest?.email) {
          isAuthenticated = true;
          if (!sessionUserObj) {
            sessionUserObj = latest;
          }
          // Si vita_session_user est manquant, le restaurer immédiatement
          if (!sessionUserCookie) {
            response.cookies.set("vita_session_user", JSON.stringify(latest), {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
            });
          }
          if (!testUser && latest.username) {
            response.cookies.set("vita_test_user", latest.username, {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
            });
          }
          if (!testRole && latest.role) {
            response.cookies.set("vita_test_role", latest.role, {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
            });
          }
        }
      }
    } catch {}
  }

  // Vérifier s'il y a un cookie de session Supabase officiel (sb-*-auth-token, y compris chunked .0, .1)
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  // Si un cookie Supabase officiel existe, synchroniser la session avec getAll/setAll
  if (hasSupabaseAuthCookie) {
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
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        });

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          isAuthenticated = true;
          if (!sessionUserCookie) {
            const rawName =
              (user.user_metadata?.username as string) ||
              (user.user_metadata?.full_name as string) ||
              (user.email ? user.email.split("@")[0] : "Membre");
            const isUserActuallyActivated = Boolean(
              user.user_metadata?.is_activated ||
              request.cookies.get("vita_account_activated")?.value === "true"
            );
            const healedUser = {
              id: user.id,
              username: rawName,
              fullName: rawName,
              email: user.email || "",
              role: (user.user_metadata?.role as string) || "user",
              isActivated: isUserActuallyActivated,
            };
            sessionUserObj = healedUser;
            response.cookies.set("vita_session_user", JSON.stringify(healedUser), {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
            });
            response.cookies.set("vita_test_user", rawName, {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
            });
          }
        }
      } catch {
        // Échec fermé
      }
    }
  }

  // Détection du rôle administrateur
  const isAdminUser =
    testRole === "admin" ||
    Boolean(adminUnlockCookie) ||
    sessionUserObj?.role === "admin" ||
    sessionUserObj?.username?.toLowerCase() === "espoir" ||
    sessionUserObj?.email === "adayiespoir60@gmail.com" ||
    testUser?.toLowerCase() === "espoir";

  // Détection du statut d'activation effectif
  const isUserActivated =
    isAccountActivated ||
    Boolean(sessionUserObj?.isActivated) ||
    isAdminUser;

  // RÈGLE P0 : Sas de déverrouillage Administrateur obligatoire (Face ID / Code Secret)
  // Le sas /admin/lock reste accessible pour la saisie du code secret maître
  if (path.startsWith("/admin") && path !== "/admin/lock") {
    if (!adminUnlockCookie) {
      const lockUrl = new URL("/admin/lock", request.url);
      return NextResponse.redirect(lockUrl);
    }
  }

  // 3. Si l'utilisateur n'est PAS connecté et tente d'accéder à une page protégée
  // (Tableau de bord /, Portefeuille, Vendre, Profil, Tâches, etc.)
  if (!isAuthenticated && !isAuthPath) {
    // Le sas admin est toujours accessible directement
    if (path === "/admin/lock") {
      return response;
    }
    const redirectUrl = new URL("/auth/login", request.url);
    if (path !== "/") {
      redirectUrl.searchParams.set("redirect", path);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 3b. RÈGLE STRICTE P0 : Verrouillage absolu du tableau de bord et des sections membres
  // pour tout utilisateur non activé. Redirection obligatoire vers /activation.
  if (isAuthenticated && !isAdminUser && !isUserActivated) {
    const isAllowedForUnactivated =
      path === "/activation" ||
      path.startsWith("/activation/") ||
      path.startsWith("/auth/") ||
      path === "/auth/logout";

    if (!isAllowedForUnactivated) {
      return NextResponse.redirect(new URL("/activation", request.url));
    }
  }

  // 4. Si l'utilisateur EST déjà connecté et visite /auth/login
  if (isAuthenticated && path === "/auth/login") {
    if (!isUserActivated && !isAdminUser) {
      return NextResponse.redirect(new URL("/activation", request.url));
    }
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      redirectParam !== "/auth/login" &&
      redirectParam !== "/auth/register"
    ) {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthenticated && path === "/auth/register" && !request.nextUrl.searchParams.has("sponsor")) {
    if (!isUserActivated && !isAdminUser) {
      return NextResponse.redirect(new URL("/activation", request.url));
    }
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
