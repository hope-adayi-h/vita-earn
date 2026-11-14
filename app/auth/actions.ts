"use server";

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

import type { ActionResponse } from "./types";

export type { ActionResponse };

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
  const supabase = createClient();
  const appUrl = getAppUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase().trim(),
        full_name: username,
        country,
        phone,
        upline: upline && upline !== "No One" && upline !== "Aucun" ? upline : null,
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("User already registered") || error.status === 400) {
      return { error: "Un compte existe déjà avec cette adresse e-mail." };
    }
    return { error: "Impossible de créer le compte. Veuillez réessayer ultérieurement." };
  }

  // Tenter de synchroniser le profil utilisateur avec username, referral_code et parrain
  if (data.user?.id) {
    try {
      const adminClient = createAdminClient();
      
      // Assurer un referral_code unique s'il n'existe pas encore
      const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("referral_code")
        .eq("id", data.user.id)
        .maybeSingle();

      let userReferralCode = currentProfile?.referral_code;
      if (!userReferralCode) {
        userReferralCode = "VE" + Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      await adminClient
        .from("profiles")
        .update({
          full_name: username,
          phone: phone,
          referral_code: userReferralCode,
        })
        .eq("id", data.user.id);

      // Enregistrement sécurisé du parrain s'il est spécifié
      if (upline && upline !== "No One" && upline !== "Aucun") {
        const cleanUpline = upline.trim();
        const { data: referrer } = await adminClient
          .from("profiles")
          .select("id")
          .or(`referral_code.eq.${cleanUpline.toUpperCase()},full_name.ilike.${cleanUpline}`)
          .neq("id", data.user.id)
          .maybeSingle();

        if (referrer?.id) {
          await adminClient
            .from("referrals")
            .insert({
              referrer_id: referrer.id,
              referred_id: data.user.id,
            });
        }
      }

      // Confirmer automatiquement l'email si possible pour permettre l'activation immédiate
      try {
        await adminClient.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        });

        const { data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInData?.session) {
          redirect("/activation");
        }
      } catch {
        // Poursuite si la politique email de Supabase est stricte
      }
    } catch {
      // Ignoré en mode dev local sans base connectée
    }
  }

  if (data.session) {
    redirect("/activation");
  }

  return {
    success: true,
    message:
      "Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter ou procéder à l'activation.",
  };
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

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Identifiant ou mot de passe invalide." };
  }

  const { identifier, password } = parsed.data;
  const cookieStore = cookies();
  const cleanId = identifier.toLowerCase().trim();

  // 1. Compte test Administrateur dédié
  const isTestAdmin =
    (cleanId === "admin" || cleanId === "admin@vitaearn.com") &&
    (password === "Admin2026!" || password === "admin123" || password === "admin");

  if (isTestAdmin) {
    cookieStore.set("vita_test_role", "admin", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("vita_test_user", "Administrateur", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("vita_test_email", "admin@vitaearn.com", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    try {
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: "admin@vitaearn.com",
        password,
      });
    } catch {
      // Ignoré si Supabase local non connecté
    }

    redirect("/admin");
  }

  // 2. Compte test Utilisateur dédié
  const isTestUser =
    (cleanId === "koffi" || cleanId === "koffi@vitaearn.com") &&
    (password === "User2026!" || password === "koffi123" || password === "koffi");

  if (isTestUser) {
    cookieStore.set("vita_test_role", "user", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("vita_test_user", "Koffi", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("vita_test_email", "koffi@vitaearn.com", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    try {
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: "koffi@vitaearn.com",
        password,
      });
    } catch {
      // Ignoré si Supabase local non connecté
    }

    redirect("/");
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

  if (error) {
    return {
      error: "Identifiant ou mot de passe incorrect.",
    };
  }

  // Vérifier si le compte est activé pour rediriger intelligemment
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_activated")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_activated) {
      redirect("/activation");
    }
  }

  redirect("/profil");
}

/**
 * Déconnexion
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete("vita_test_role");
  cookieStore.delete("vita_test_user");
  cookieStore.delete("vita_test_email");
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

/**
 * Demande de réinitialisation de mot de passe (mot de passe oublié)
 */
export async function forgotPasswordAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email"),
  };

  const parsed = forgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Veuillez saisir une adresse e-mail valide." };
  }

  const { email } = parsed.data;
  const supabase = createClient();
  const appUrl = getAppUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  });

  if (error) {
    return {
      error: "Impossible d'envoyer l'e-mail de réinitialisation. Veuillez réessayer plus tard.",
    };
  }

  return {
    success: true,
    message: "Un lien de réinitialisation a été envoyé à votre adresse e-mail.",
  };
}

/**
 * Mise à jour du mot de passe avec le jeton reçu
 */
export async function resetPasswordAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Les mots de passe saisis sont invalides ou ne correspondent pas." };
  }

  const { password } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      error: "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.",
    };
  }

  redirect("/auth/login?reset=success");
}
