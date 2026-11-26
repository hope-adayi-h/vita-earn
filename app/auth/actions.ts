"use server";

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveUser, findUserByIdentifier } from "@/lib/auth/local-store";
import { checkLoginRateLimit, checkRegisterRateLimit } from "@/lib/security/rate-limit";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

import type { ActionResponse } from "./types";

export type { ActionResponse };

const isProd = process.env.NODE_ENV === "production";
const AUTH_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 jours
};

function getAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;

  const headerList = headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUpAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email"),
    username: formData.get("username"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    upline: formData.get("upline"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    termsAccepted:
      formData.get("termsAccepted") === "on" ||
      formData.get("termsAccepted") === "true",
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      const field = err.path[0];
      if (field) fieldErrors[field.toString()] = err.message;
    });
    return { error: "Veuillez vérifier les champs du formulaire.", fieldErrors };
  }

  const { email, username, country, phone, password, upline } = parsed.data;
  const cookieStore = cookies();
  const cleanUsername = username.trim();
  const cleanEmail = email.toLowerCase().trim();

  // RÈGLE DE SÉCURITÉ P2 : Protection contre les inscriptions massives automatisées
  const regLimit = checkRegisterRateLimit(cleanEmail);
  if (!regLimit.allowed) {
    return {
      error: `Trop de tentatives d'inscription. Veuillez patienter ${regLimit.resetInSeconds} secondes avant de réessayer.`,
    };
  }

  const appUrl = getAppUrl();

  let registeredUserId = "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
      !supabaseUrl.includes("placeholder") &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
  );

  if (isSupabaseConfigured) {
    try {
      const adminClient = createAdminClient();
      const supabase = createClient();
      let registeredUser: any = null;

      // CRÉATION PRÉ-CONFIRMÉE DIRECTE : Bypasse tout envoi d'e-mail de confirmation
      const { data: adminCreated, error: adminErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: cleanUsername.toLowerCase(),
          full_name: cleanUsername,
          country,
          phone,
          upline: upline && upline !== "No One" && upline !== "Aucun" ? upline : null,
        },
      });

      if (adminErr) {
        const errMsg = (adminErr.message || "").toLowerCase();
        if (
          errMsg.includes("already registered") ||
          errMsg.includes("already exists") ||
          adminErr.status === 422
        ) {
          return { error: "Un compte existe déjà avec cette adresse e-mail." };
        }

        // En cas d'erreur de clé admin, repli sur l'inscription standard
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername.toLowerCase(),
              full_name: cleanUsername,
              country,
              phone,
              upline: upline && upline !== "No One" && upline !== "Aucun" ? upline : null,
            },
          },
        });

        if (signUpErr) {
          if (signUpErr.message.toLowerCase().includes("already registered") || signUpErr.status === 400) {
            return { error: "Un compte existe déjà avec cette adresse e-mail." };
          }
        } else if (signUpData?.user) {
          registeredUser = signUpData.user;
          try {
            await adminClient.auth.admin.updateUserById(signUpData.user.id, {
              email_confirm: true,
            });
          } catch {}
        }
      } else if (adminCreated?.user) {
        registeredUser = adminCreated.user;
      }

      if (registeredUser?.id) {
        registeredUserId = registeredUser.id;

        // Connexion immédiate pour poser les cookies de session Supabase sans vérification
        try {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
        } catch {}

        try {
          const userReferralCode =
            "VE" + Math.random().toString(36).substring(2, 8).toUpperCase();

          await adminClient
            .from("profiles")
            .update({
              full_name: cleanUsername,
              phone: phone,
              referral_code: userReferralCode,
            })
            .eq("id", registeredUser.id);

          if (upline && upline !== "No One" && upline !== "Aucun") {
            const cleanUpline = upline.trim().replace(/^@/, "");
            // RÈGLE P2 : Recherche insensible à la casse par nom d'utilisateur, nom complet ou code de parrainage
            const { data: referrer } = await adminClient
              .from("profiles")
              .select("id, full_name, username, referral_code")
              .or(`full_name.ilike.${cleanUpline},username.ilike.${cleanUpline},referral_code.ilike.${cleanUpline}`)
              .neq("id", registeredUser.id)
              .limit(1)
              .maybeSingle();

            let referrerId = referrer?.id;
            if (
              !referrerId &&
              (cleanUpline.toLowerCase() === "espoir" ||
                cleanUpline.toLowerCase() === "admin" ||
                cleanUpline.toUpperCase() === "VE-ESPOIR")
            ) {
              const { data: adminProf } = await adminClient
                .from("profiles")
                .select("id")
                .eq("role", "admin")
                .limit(1)
                .maybeSingle();
              referrerId = adminProf?.id;
            }

            if (referrerId) {
              await adminClient.from("referrals").insert({
                referrer_id: referrerId,
                referred_id: registeredUser.id,
              });
            }
          }
        } catch {}
      }
    } catch {
      // Poursuivre vers la création de session locale
    }
  }

  // Session utilisateur mémorisée dès l'inscription
  const finalUserId = registeredUserId || "usr_" + Math.random().toString(36).substring(2, 10);
  const cleanUpline = upline && upline !== "No One" && upline !== "Aucun" ? upline.trim().replace(/^@/, "") : null;

  const userSessionData = {
    id: finalUserId,
    username: cleanUsername,
    fullName: cleanUsername,
    email: cleanEmail,
    phone: phone,
    country: country,
    upline: cleanUpline,
    role: "user",
    isActivated: false,
  };

  // Enregistrer le compte de façon persistante dans le store local
  saveUser({
    id: finalUserId,
    username: cleanUsername,
    email: cleanEmail,
    phone: phone,
    country: country,
    password: password,
    upline: cleanUpline,
    role: "user",
    isActivated: false,
    createdAt: new Date().toISOString(),
  });

  // Mémoriser le compte dans le coffre persistant du navigateur (vita_accounts)
  try {
    let knownAccounts: any[] = [];
    const rawKnown = cookieStore.get("vita_accounts")?.value;
    if (rawKnown) knownAccounts = JSON.parse(rawKnown);
    if (!Array.isArray(knownAccounts)) knownAccounts = [];

    // RÈGLE P1 : Le mot de passe ne doit JAMAIS être stocké en clair dans les cookies
    const newRec = {
      id: finalUserId,
      username: cleanUsername,
      email: cleanEmail,
      phone: phone,
      country: country,
      upline: cleanUpline,
      role: "user",
      isActivated: false,
    };
    const idx = knownAccounts.findIndex(
      (a) => a.username?.toLowerCase() === cleanUsername.toLowerCase() || a.email?.toLowerCase() === cleanEmail.toLowerCase()
    );
    if (idx >= 0) {
      knownAccounts[idx] = newRec;
    } else {
      knownAccounts.push(newRec);
    }
    cookieStore.set("vita_accounts", JSON.stringify(knownAccounts), {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {}

  cookieStore.set("vita_session_user", JSON.stringify(userSessionData), AUTH_COOKIE_OPTIONS);
  cookieStore.set("vita_test_role", "user", AUTH_COOKIE_OPTIONS);
  cookieStore.set("vita_test_user", cleanUsername, AUTH_COOKIE_OPTIONS);
  cookieStore.set("vita_test_email", cleanEmail, AUTH_COOKIE_OPTIONS);
  cookieStore.delete("vita_logged_out");
  cookieStore.delete("vita_account_activated");
  cookieStore.delete("vita_admin_unlocked");
  if (phone) {
    cookieStore.set("vita_registered_phone", phone, { ...AUTH_COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 365 });
  }

  // Redirection OBLIGATOIRE et immédiate vers la page d'activation
  redirect("/activation");
}

/**
 * Connexion d'un utilisateur (accepte nom d'utilisateur OU adresse e-mail)
 */
export async function signInAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  };

  const rawRedirect = formData.get("redirect") as string | null;
  const redirectTarget =
    rawRedirect &&
    rawRedirect.startsWith("/") &&
    !rawRedirect.startsWith("/auth") &&
    rawRedirect !== "/activation"
      ? rawRedirect
      : "/";

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Identifiant ou mot de passe invalide." };
  }

  const { identifier, password } = parsed.data;
  const cookieStore = cookies();
  const cleanId = identifier.toLowerCase().trim();

  // RÈGLE DE SÉCURITÉ P2 : Protection contre la force brute (5 tentatives max par 5 minutes)
  const loginLimit = checkLoginRateLimit(cleanId);
  if (!loginLimit.allowed) {
    return {
      error: `Trop de tentatives de connexion échouées. Par sécurité, veuillez patienter ${loginLimit.resetInSeconds} secondes.`,
    };
  }

  // 1. Lire le coffre de comptes persistant dans le navigateur
  let knownAccounts: any[] = [];
  try {
    const rawKnown = cookieStore.get("vita_accounts")?.value;
    if (rawKnown) knownAccounts = JSON.parse(rawKnown);
    if (!Array.isArray(knownAccounts)) knownAccounts = [];
  } catch {}

  let matchedAccount: any = knownAccounts.find(
    (a) =>
      a.username?.toLowerCase() === cleanId ||
      a.email?.toLowerCase() === cleanId ||
      (a.phone && a.phone.replace(/\s+/g, "") === cleanId.replace(/\s+/g, ""))
  );

  // 2. Recherche dans le store local (registered_users.json) pour récupérer le mot de passe local si présent
  const localUser = findUserByIdentifier(cleanId);
  if (!matchedAccount && localUser) {
    matchedAccount = localUser;
  } else if (matchedAccount && localUser?.password && !matchedAccount.password) {
    matchedAccount.password = localUser.password;
  }

  // 3. Compte Super Administrateur Principal (Espoir)
  const isEspoir =
    cleanId === "adayiespoir60@gmail.com" ||
    cleanId === "espoir";

  if (isEspoir) {
    let isEspoirPasswordValid = false;

    if (matchedAccount?.password && matchedAccount.password === password) {
      isEspoirPasswordValid = true;
    } else if (password === "Espoir@Vita2026!") {
      isEspoirPasswordValid = true;
    } else {
      try {
        const supabase = createClient();
        const { error: sbErr } = await supabase.auth.signInWithPassword({
          email: "adayiespoir60@gmail.com",
          password,
        });
        if (!sbErr) isEspoirPasswordValid = true;
      } catch {}
    }

    if (isEspoirPasswordValid) {
      let espoirPhone = "";
      try {
        const adminClient = createAdminClient();
        const { data: p } = await adminClient
          .from("profiles")
          .select("phone")
          .eq("id", "333d799b-84ea-493b-b35e-754f88c81b7f")
          .maybeSingle();
        if (p?.phone) espoirPhone = p.phone;
      } catch {}

      const userSessionData = {
        id: "333d799b-84ea-493b-b35e-754f88c81b7f",
        username: "Espoir",
        fullName: "Espoir",
        email: "adayiespoir60@gmail.com",
        phone: espoirPhone,
        country: "Togo",
        role: "admin",
        isActivated: true,
      };

      cookieStore.set("vita_session_user", JSON.stringify(userSessionData), AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_role", "admin", AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_user", "Espoir", AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_email", "adayiespoir60@gmail.com", AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_account_activated", "true", AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_logged_out", "", { path: "/", maxAge: 0, expires: new Date(0) });
      if (espoirPhone) {
        cookieStore.set("vita_registered_phone", espoirPhone, AUTH_COOKIE_OPTIONS);
      }

      redirect(redirectTarget);
    } else {
      return { error: "Mot de passe administrateur incorrect." };
    }
  }

  // 4. Recherche dans Supabase si non trouvé dans les stores locaux
  if (!matchedAccount) {
    try {
      const adminClient = createAdminClient();
      let dbProf: any = null;

      if (cleanId.includes("@")) {
        const { data: userListData } = await adminClient.auth.admin.listUsers({ perPage: 200 });
        const foundAuthUser = userListData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanId
        );
        if (foundAuthUser) {
          const { data: p } = await adminClient
            .from("profiles")
            .select("id, full_name, phone, role, is_activated, referral_code")
            .eq("id", foundAuthUser.id)
            .maybeSingle();
          if (p) dbProf = p;
        }
      }

      if (!dbProf) {
        const { data: p } = await adminClient
          .from("profiles")
          .select("id, full_name, phone, role, is_activated, referral_code")
          .or(`full_name.ilike.${cleanId},phone.ilike.%${cleanId.replace(/\s+/g, "")}%`)
          .limit(1)
          .maybeSingle();
        dbProf = p;
      }

      if (dbProf) {
        matchedAccount = {
          id: dbProf.id,
          username: dbProf.full_name || cleanId,
          email: cleanId.includes("@") ? cleanId : `${cleanId.toLowerCase()}@vitaearn.com`,
          phone: dbProf.phone || "",
          country: "Togo",
          role: dbProf.role || "user",
          isActivated: Boolean(dbProf.is_activated),
        };
      }
    } catch {}
  }

  if (matchedAccount) {
    if (matchedAccount.isBanned || matchedAccount.status === "banned") {
      return {
        error: "Votre compte a été supprimé par l'administrateur. Veuillez contacter le support client pour avoir plus d'informations.",
      };
    }

    // Vérification STRICTE du mot de passe : uniquement le mot de passe réel du compte
    let isPasswordValid = false;

    if (matchedAccount.password) {
      isPasswordValid = matchedAccount.password === password;
    }

    // Si non vérifié localement (ex: compte créé sur un autre appareil / stocké dans Supabase Auth),
    // vérifier obligatoirement auprès de Supabase Auth avec le vrai e-mail du compte.
    if (!isPasswordValid) {
      try {
        let authEmailToCheck = matchedAccount.email || "";
        const adminClient = createAdminClient();

        if (matchedAccount.id && matchedAccount.id.includes("-")) {
          const { data: authRecord } = await adminClient.auth.admin.getUserById(matchedAccount.id);
          if (authRecord?.user?.email) {
            authEmailToCheck = authRecord.user.email;
          }
        }

        if (authEmailToCheck) {
          const supabase = createClient();
          const { error: sbSignInErr } = await supabase.auth.signInWithPassword({
            email: authEmailToCheck,
            password,
          });
          if (!sbSignInErr) {
            isPasswordValid = true;
          }
        }
      } catch {}
    }

    if (isPasswordValid) {
      // Vérifier le statut réel en base Supabase (priorité absolue)
      let liveIsActivated = Boolean(matchedAccount.isActivated);
      let livePhone = matchedAccount.phone || "";
      let liveFullName = matchedAccount.username;
      let liveUpline = matchedAccount.upline || null;

      try {
        const adminClient = createAdminClient();
        const query =
          matchedAccount.id && matchedAccount.id.includes("-")
            ? adminClient
                .from("profiles")
                .select("id, full_name, phone, role, is_activated")
                .eq("id", matchedAccount.id)
            : adminClient
                .from("profiles")
                .select("id, full_name, phone, role, is_activated")
                .or(`full_name.ilike.${matchedAccount.username},username.ilike.${matchedAccount.username}`)
                .limit(1);

        const { data: liveProf } = await query.maybeSingle();
        if (liveProf) {
          liveIsActivated = Boolean(liveProf.is_activated);
          if (liveProf.phone) livePhone = liveProf.phone;
          if (liveProf.full_name) liveFullName = liveProf.full_name;

          // Chercher le parrain réel dans Supabase referrals
          const { data: upRef } = await adminClient
            .from("referrals")
            .select("referrer_id")
            .eq("referred_id", liveProf.id)
            .maybeSingle();

          if (upRef?.referrer_id) {
            const { data: upProf } = await adminClient
              .from("profiles")
              .select("full_name, username")
              .eq("id", upRef.referrer_id)
              .maybeSingle();
            if (upProf?.full_name || upProf?.username) {
              liveUpline = upProf.full_name || upProf.username;
            }
          }
        }
      } catch {}

      const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";
      const finalIsActivated = Boolean(liveIsActivated || isActivatedCookie);

      const userSessionData = {
        id: matchedAccount.id,
        username: liveFullName,
        fullName: liveFullName,
        email: matchedAccount.email,
        phone: livePhone,
        country: matchedAccount.country || "Togo",
        upline: liveUpline,
        role: matchedAccount.role || "user",
        isActivated: finalIsActivated,
      };

      // Mettre à jour le cache de compte persistant avec le statut réel
      matchedAccount.isActivated = finalIsActivated;
      matchedAccount.phone = livePhone;
      matchedAccount.upline = liveUpline;
      const accIdx = knownAccounts.findIndex((a) => a.id === matchedAccount.id || a.username === matchedAccount.username);
      if (accIdx >= 0) {
        knownAccounts[accIdx] = { ...knownAccounts[accIdx], ...matchedAccount };
      } else {
        knownAccounts.push(matchedAccount);
      }
      cookieStore.set("vita_accounts", JSON.stringify(knownAccounts), {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
      });
      saveUser(matchedAccount);

      cookieStore.set("vita_session_user", JSON.stringify(userSessionData), AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_role", matchedAccount.role || "user", AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_user", liveFullName, AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_email", matchedAccount.email, AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_logged_out", "", { path: "/", maxAge: 0, expires: new Date(0) });

      if (finalIsActivated) {
        cookieStore.set("vita_account_activated", "true", AUTH_COOKIE_OPTIONS);
      } else {
        cookieStore.delete("vita_account_activated");
      }
      if (livePhone) {
        cookieStore.set("vita_registered_phone", livePhone, {
          ...AUTH_COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 365,
        });
      }

      if (!finalIsActivated) {
        redirect("/activation");
      }

      redirect(redirectTarget);
    } else {
      return { error: "Mot de passe incorrect." };
    }
  }

  const supabase = createClient();

  let emailToUse = identifier;

  // Si l'utilisateur entre son nom d'utilisateur (pas de @)
  if (!identifier.includes("@")) {
    try {
      const adminClient = createAdminClient();

      // 1. Chercher dans profiles si la colonne username existe
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", identifier.toLowerCase().trim())
        .maybeSingle();

      if (profile?.id) {
        const { data: userRecord } = await adminClient.auth.admin.getUserById(profile.id);
        if (userRecord?.user?.email) {
          emailToUse = userRecord.user.email;
        }
      } else {
        // 2. Chercher dans les métadonnées auth
        const { data: usersList } = await adminClient.auth.admin.listUsers({ perPage: 200 });
        const matched = usersList?.users?.find(
          (u) =>
            u.user_metadata?.username?.toLowerCase() === identifier.toLowerCase().trim() ||
            u.email?.split("@")[0].toLowerCase() === identifier.toLowerCase().trim()
        );
        if (matched?.email) {
          emailToUse = matched.email;
        }
      }
    } catch {
      // Poursuivre vers supabase.auth.signInWithPassword
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (!error) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      if (user.user_metadata?.is_banned) {
        return {
          error: "Votre compte a été supprimé par l'administrateur. Veuillez contacter le support client pour avoir plus d'informations.",
        };
      }

      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, is_activated, role, phone")
        .eq("id", user.id)
        .maybeSingle();

      const displayName =
        profile?.full_name ||
        (user.user_metadata?.username as string) ||
        (user.email ? user.email.split("@")[0] : identifier);

      const isActivated = Boolean(profile?.is_activated);

      const userSessionData = {
        id: user.id,
        username: displayName,
        fullName: displayName,
        email: user.email,
        phone: profile?.phone || "",
        role: profile?.role || "user",
        isActivated,
      };

      cookieStore.set("vita_session_user", JSON.stringify(userSessionData), AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_role", profile?.role || "user", AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_user", displayName, AUTH_COOKIE_OPTIONS);
      cookieStore.set("vita_test_email", user.email || "", AUTH_COOKIE_OPTIONS);
      if (profile?.phone) {
        cookieStore.set("vita_registered_phone", profile.phone, AUTH_COOKIE_OPTIONS);
      }
      cookieStore.set("vita_logged_out", "", { path: "/", maxAge: 0, expires: new Date(0) });
      if (isActivated) {
        cookieStore.set("vita_account_activated", "true", AUTH_COOKIE_OPTIONS);
      }

      if (!isActivated) {
        redirect("/activation");
      }

      redirect(redirectTarget);
    }
  }

  return {
    error: "Identifiant ou mot de passe incorrect.",
  };
}

/**
 * Déconnexion
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete("vita_test_role");
  cookieStore.delete("vita_test_user");
  cookieStore.delete("vita_test_email");
  cookieStore.delete("vita_session_user");
  cookieStore.delete("vita_account_activated");
  cookieStore.set("vita_logged_out", "true", {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}
  redirect("/auth/login");
}

/**
 * Demande de réinitialisation de mot de passe (mot de passe oublié)
 */
export async function forgotPasswordAction(
  _prevState: ActionResponse | null,
  _formData: FormData
): Promise<ActionResponse> {
  return {
    error:
      "La modification du mot de passe par l'utilisateur est désactivée. Seul le mot de passe initial permet d'accéder au compte.",
  };
}

/**
 * Mise à jour du mot de passe désactivée côté utilisateur
 */
export async function resetPasswordAction(
  _prevState: ActionResponse | null,
  _formData: FormData
): Promise<ActionResponse> {
  return {
    error:
      "La modification du mot de passe par l'utilisateur est désactivée. Seul le mot de passe initial permet d'accéder au compte.",
  };
}
