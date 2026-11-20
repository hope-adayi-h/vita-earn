import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminSession } from "@/lib/security/admin-lock";
import {
  resolveAlternativePaymentForUser,
  saveAlternativePaymentSettings,
  getAlternativePaymentSettings,
} from "@/lib/data/alternative-payment-store";

export const dynamic = "force-dynamic";

/**
 * Route GET : Lecture de la configuration du paiement alternatif
 * STRICTEMENT CONTRÔLÉ CÔTÉ SERVEUR :
 * Ne renvoie le lien QUE si l'interrupteur est actif ET que le pays du profil de l'utilisateur est éligible.
 * Un utilisateur non éligible ne reçoit jamais le lien.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    let profileCountry: string | null = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from("profiles")
          .select("country")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.country) {
          profileCountry = profile.country;
        }
      }
    } catch {}

    if (!profileCountry) {
      const cookieStore = cookies();
      const rawSession = cookieStore.get("vita_session_user")?.value;
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession);
          if (parsed?.country) profileCountry = parsed.country;
        } catch {}
      }
    }

    const config = await resolveAlternativePaymentForUser(profileCountry);

    if (!config) {
      return NextResponse.json({
        available: false,
        message: "Paiement alternatif non disponible ou non éligible pour ce pays.",
        config: null,
      });
    }

    return NextResponse.json({
      available: true,
      config,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { available: false, error: "Erreur serveur lors de la vérification du paiement alternatif." },
      { status: 500 }
    );
  }
}

/**
 * Route POST : Modification de la configuration du paiement alternatif
 * STRICTEMENT RÉSERVÉE AUX ADMINISTRATEURS :
 * Tout utilisateur non administrateur reçoit une erreur 403 Forbidden immédiate.
 */
export async function POST(req: NextRequest) {
  try {
    const { isAdmin, userEmail } = await checkAdminSession();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès formellement refusé (403) : Privilèges administrateur requis pour modifier ces paramètres.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const result = await saveAlternativePaymentSettings(
      {
        isEnabled: Boolean(body.isEnabled),
        paymentUrl: body.paymentUrl || "",
        buttonLabel: body.buttonLabel,
        userMessage: body.userMessage,
        targetCountries: Array.isArray(body.targetCountries) ? body.targetCountries : [],
        allCountries: Boolean(body.allCountries),
        email: body.email,
        whatsappNumber: body.whatsappNumber,
        postPaymentInstructions: body.postPaymentInstructions,
      },
      userEmail || "admin_api"
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur de validation." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Paramètres mis à jour avec succès.",
      settings: result.settings,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la mise à jour." },
      { status: 500 }
    );
  }
}
