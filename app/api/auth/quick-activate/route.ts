import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { activateUser } from "@/lib/auth/local-store";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Lire les données soumises via le formulaire STK
  let formUsername = "";
  let formFullName = "";
  let formEmail = "";
  let formPhone = "";

  try {
    const formData = await req.formData();
    formUsername = (formData.get("username") as string)?.trim() || "";
    formFullName = (formData.get("fullName") as string)?.trim() || "";
    formEmail = (formData.get("email") as string)?.trim() || "";
    formPhone =
      (formData.get("phone") as string)?.trim() ||
      (formData.get("walletNumber") as string)?.trim() ||
      "";
  } catch {}

  let chosenUsername = "";
  let chosenFullName = "";
  let chosenEmail = "";
  let chosenPhone = "";

  // 1. Depuis le formulaire soumis
  if (
    formUsername &&
    formUsername.toLowerCase() !== "membre" &&
    formUsername.toLowerCase() !== "utilisateur" &&
    formUsername.toLowerCase() !== "nouvel utilisateur"
  ) {
    chosenUsername = formUsername;
  }
  if (
    formFullName &&
    formFullName.toLowerCase() !== "membre" &&
    formFullName.toLowerCase() !== "utilisateur"
  ) {
    chosenFullName = formFullName;
  }
  if (formEmail) chosenEmail = formEmail;
  if (formPhone) chosenPhone = formPhone;

  // 2. Depuis sessionUser si non déterminé
  if (
    !chosenUsername &&
    sessionUser?.username &&
    sessionUser.username.toLowerCase() !== "membre"
  ) {
    chosenUsername = sessionUser.username;
  }
  if (
    !chosenFullName &&
    sessionUser?.fullName &&
    sessionUser.fullName.toLowerCase() !== "membre"
  ) {
    chosenFullName = sessionUser.fullName;
  }
  if (!chosenEmail && sessionUser?.email) chosenEmail = sessionUser.email;
  if (!chosenPhone && sessionUser?.phone) chosenPhone = sessionUser.phone;

  // 3. Depuis testUser si non déterminé
  if (!chosenUsername && testUser && testUser.toLowerCase() !== "membre") {
    chosenUsername = testUser;
  }
  if (!chosenEmail && testEmail) chosenEmail = testEmail;

  // 4. Depuis vita_accounts (coffre persistant du navigateur)
  let knownAccounts: any[] = [];
  try {
    const rawKnown = cookieStore.get("vita_accounts")?.value;
    if (rawKnown) knownAccounts = JSON.parse(rawKnown);
  } catch {}
  if (!Array.isArray(knownAccounts)) knownAccounts = [];

  if (!chosenUsername && knownAccounts.length > 0) {
    const lastReal = [...knownAccounts].reverse().find(
      (a) =>
        a.username &&
        a.username.toLowerCase() !== "membre" &&
        a.username.toLowerCase() !== "admin"
    );
    if (lastReal) {
      chosenUsername = lastReal.username;
      chosenFullName = lastReal.fullName || lastReal.username;
      if (!chosenEmail && lastReal.email) chosenEmail = lastReal.email;
      if (!chosenPhone && lastReal.phone) chosenPhone = lastReal.phone;
    }
  }

  // 5. Depuis Supabase auth si connecté
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      if (!chosenEmail) chosenEmail = authUser.email || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile?.full_name && profile.full_name.toLowerCase() !== "membre") {
        if (!chosenUsername) chosenUsername = profile.full_name;
        if (!chosenFullName) chosenFullName = profile.full_name;
      }
      if (profile?.phone && !chosenPhone) chosenPhone = profile.phone;

      // Mettre à jour Supabase profile avec is_activated = true
      const adminClient = createAdminClient();
      await adminClient
        .from("profiles")
        .update({
          is_activated: true,
          ...(chosenFullName ? { full_name: chosenFullName } : {}),
          ...(chosenPhone ? { phone: chosenPhone } : {}),
        })
        .eq("id", authUser.id);
    }
  } catch {}

  const finalUsername =
    chosenUsername || sessionUser?.username || testUser || "Utilisateur";
  const finalFullName = chosenFullName || finalUsername;
  const finalEmail =
    chosenEmail || sessionUser?.email || testEmail || "user@vitaearn.com";
  const finalPhone = chosenPhone || sessionUser?.phone || "";

  const finalSession = {
    id: sessionUser?.id || "usr_" + Date.now().toString(36),
    username: finalUsername,
    fullName: finalFullName,
    email: finalEmail,
    phone: finalPhone,
    role: sessionUser?.role || "user",
    isActivated: true,
  };

  activateUser(finalSession.id || finalSession.username || finalSession.email);

  // Mettre à jour le coffre persistant vita_accounts
  const clean = finalSession.username.toLowerCase();
  const idx = knownAccounts.findIndex(
    (a) =>
      a.username?.toLowerCase() === clean ||
      (finalSession.email &&
        a.email?.toLowerCase() === finalSession.email.toLowerCase())
  );
  if (idx >= 0) {
    knownAccounts[idx].isActivated = true;
    knownAccounts[idx].username = finalUsername;
    knownAccounts[idx].fullName = finalFullName;
    if (finalPhone) knownAccounts[idx].phone = finalPhone;
  } else {
    knownAccounts.push(finalSession);
  }

  // Préparer la réponse de redirection
  const url = new URL("/", req.url);
  const response = NextResponse.redirect(url, { status: 303 });

  // Options communes pour les cookies (1 an pour garantir la persistance)
  const cookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  response.cookies.set("vita_account_activated", "true", cookieOptions);
  response.cookies.set(
    "vita_session_user",
    JSON.stringify(finalSession),
    cookieOptions
  );
  response.cookies.set("vita_test_role", finalSession.role || "user", cookieOptions);
  response.cookies.set("vita_test_user", finalSession.username, cookieOptions);
  response.cookies.set("vita_test_email", finalSession.email || "", cookieOptions);
  response.cookies.set("vita_accounts", JSON.stringify(knownAccounts), cookieOptions);

  return response;
}

export async function GET(req: Request) {
  return POST(req);
}
