import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { activateUser } from "@/lib/auth/local-store";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }
  const testUser = cookieStore.get("vita_test_user")?.value;
  const testEmail = cookieStore.get("vita_test_email")?.value;

  // Créer ou activer la session
  let finalSession: any;
  if (sessionUser) {
    sessionUser.isActivated = true;
    finalSession = sessionUser;
    activateUser(sessionUser.id || sessionUser.username || sessionUser.email);
  } else if (testUser) {
    activateUser(testUser);
    finalSession = {
      id: "usr_" + Date.now().toString(36),
      username: testUser,
      fullName: testUser,
      email: testEmail || "user@vitaearn.com",
      role: "user",
      isActivated: true,
    };
  } else {
    finalSession = {
      id: "usr_" + Date.now().toString(36),
      username: "Membre",
      fullName: "Membre",
      email: "membre@vitaearn.com",
      role: "user",
      isActivated: true,
    };
  }

  // Mettre à jour le coffre persistant vita_accounts
  let knownAccounts: any[] = [];
  try {
    const rawKnown = cookieStore.get("vita_accounts")?.value;
    if (rawKnown) knownAccounts = JSON.parse(rawKnown);
  } catch {}
  if (!Array.isArray(knownAccounts)) knownAccounts = [];

  const clean = finalSession.username.toLowerCase();
  const idx = knownAccounts.findIndex(
    (a) => a.username?.toLowerCase() === clean || a.email?.toLowerCase() === clean
  );
  if (idx >= 0) {
    knownAccounts[idx].isActivated = true;
  } else {
    knownAccounts.push(finalSession);
  }

  // Préparer la réponse de redirection
  const url = new URL("/", req.url);
  const response = NextResponse.redirect(url, { status: 303 });

  // Options communes pour les cookies
  const cookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  // Attacher OBLIGATOIREMENT les cookies directement sur l'objet response
  response.cookies.set("vita_account_activated", "true", cookieOptions);
  response.cookies.set("vita_session_user", JSON.stringify(finalSession), cookieOptions);
  response.cookies.set("vita_test_role", finalSession.role || "user", cookieOptions);
  response.cookies.set("vita_test_user", finalSession.username, cookieOptions);
  response.cookies.set("vita_test_email", finalSession.email || "", cookieOptions);
  response.cookies.set("vita_accounts", JSON.stringify(knownAccounts), cookieOptions);

  return response;
}

export async function GET(req: Request) {
  return POST(req);
}
