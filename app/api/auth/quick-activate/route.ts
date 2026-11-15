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

  // 1. Mémoriser de façon absolue l'activation dans le cookie
  cookieStore.set("vita_account_activated", "true", {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });

  // 2. Mettre à jour la session utilisateur active
  if (sessionUser) {
    sessionUser.isActivated = true;
    cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    });
    activateUser(sessionUser.id || sessionUser.username || sessionUser.email);
  } else if (testUser) {
    activateUser(testUser);
    const newSession = {
      id: "usr_" + Date.now().toString(36),
      username: testUser,
      fullName: testUser,
      email: testEmail || "user@vitaearn.com",
      role: "user",
      isActivated: true,
    };
    cookieStore.set("vita_session_user", JSON.stringify(newSession), {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    // Si aucune session active n'existe encore
    const defaultSession = {
      id: "usr_" + Date.now().toString(36),
      username: "Membre",
      fullName: "Membre",
      email: "membre@vitaearn.com",
      role: "user",
      isActivated: true,
    };
    cookieStore.set("vita_session_user", JSON.stringify(defaultSession), {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    });
    cookieStore.set("vita_test_user", "Membre", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // 3. Mettre à jour aussi le coffre de comptes persistant (vita_accounts)
  try {
    const rawKnown = cookieStore.get("vita_accounts")?.value;
    if (rawKnown) {
      const knownAccounts = JSON.parse(rawKnown);
      const targetUser = sessionUser?.username || testUser;
      if (targetUser && Array.isArray(knownAccounts)) {
        const clean = targetUser.toLowerCase();
        knownAccounts.forEach((acc: any) => {
          if (acc.username?.toLowerCase() === clean || acc.email?.toLowerCase() === clean) {
            acc.isActivated = true;
          }
        });
        cookieStore.set("vita_accounts", JSON.stringify(knownAccounts), {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }
  } catch {}

  const url = new URL("/", req.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(req: Request) {
  return POST(req);
}
