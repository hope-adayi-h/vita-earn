"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UpdatePhoneResult {
  success: boolean;
  message?: string;
  error?: string;
  phone?: string;
}

export async function updatePhoneAction(rawPhone: string): Promise<UpdatePhoneResult> {
  try {
    const cleanPhone = (rawPhone || "").trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      return { success: false, error: "Veuillez entrer un numéro de téléphone valide." };
    }

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
    const candidateName = sessionUser?.username || sessionUser?.fullName || testUser;
    const isEspoir =
      candidateName?.toLowerCase() === "espoir" ||
      testUser?.toLowerCase() === "espoir" ||
      sessionUser?.email === "adayiespoir60@gmail.com" ||
      testEmail === "adayiespoir60@gmail.com";

    const adminClient = createAdminClient();

    // 1. Trouver le profil dans Supabase
    let targetProfileId = sessionUser?.id && sessionUser.id.includes("-") ? sessionUser.id : null;
    if (isEspoir && !targetProfileId) {
      targetProfileId = "333d799b-84ea-493b-b35e-754f88c81b7f";
    }

    if (!targetProfileId && candidateName) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("id")
        .or(`username.ilike.${candidateName.trim()},full_name.ilike.${candidateName.trim()}`)
        .limit(1)
        .maybeSingle();
      if (prof?.id) {
        targetProfileId = prof.id;
      }
    }

    if (targetProfileId) {
      await adminClient
        .from("profiles")
        .update({ phone: cleanPhone })
        .eq("id", targetProfileId);
    }

    // 2. Mettre à jour les cookies de session
    if (sessionUser) {
      sessionUser.phone = cleanPhone;
      cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    cookieStore.set("vita_registered_phone", cleanPhone, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    revalidatePath("/profil");
    return { success: true, message: "Numéro de téléphone mis à jour avec succès.", phone: cleanPhone };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur lors de la mise à jour du numéro." };
  }
}
