import { NextRequest, NextResponse } from "next/server";
import { SasPayClient } from "@/lib/payments/saspay";
import { processSuccessfulActivation } from "@/lib/payments/activation-service";

export const dynamic = "force-dynamic";

/**
 * Endpoint Webhook SasPay pour les notifications instantanées
 * Route : POST /api/webhooks/saspay
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const event = req.headers.get("x-webhook-event") || "";

    const client = new SasPayClient();

    // 1. Vérification de la signature si le secret est configuré en production
    if (process.env.SASPAY_WEBHOOK_SECRET) {
      const isValid = client.verifyWebhookSignature({
        rawBody,
        signature,
        timestamp,
      });

      if (!isValid) {
        console.warn("[SasPay Webhook] Signature invalide ou horodatage expiré");
        return NextResponse.json(
          { error: "Signature ou horodatage invalide" },
          { status: 401 }
        );
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }

    const eventName = event || payload?.event;
    const txData = payload?.data || {};

    // 2. Traitement de l'événement de test envoyé depuis le tableau de bord SasPay
    if (eventName === "webhook.test") {
      return NextResponse.json({
        success: true,
        message: "Événement de test SasPay reçu avec succès.",
      });
    }

    // 3. Traitement de l'événement transaction.success (Encaissement réussi)
    if (eventName === "transaction.success" || txData?.status === "SUCCESS") {
      const transactionId = txData?.id || txData?.transaction_id;
      const metadata = txData?.metadata || {};
      const targetUserId = metadata?.userId || metadata?.user_id;

      // Double-vérification de sécurité auprès de l'API SasPay (Règle P0)
      if (transactionId && client.isConfigured()) {
        const verifyRes = await client.verifyPayment(transactionId);
        if (verifyRes.status !== "SUCCESS") {
          console.warn("[SasPay Webhook] Double-vérification non confirmée :", verifyRes.status);
          return NextResponse.json({ error: "Transaction non confirmée" }, { status: 400 });
        }
      }

      // Si l'utilisateur est identifiable
      if (targetUserId) {
        // Activation du compte et redistribution des commissions (Règles 1 & 2 : 3 niveaux)
        await processSuccessfulActivation({
          userId: targetUserId,
          providerRef: transactionId,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Activation du compte validée via webhook SasPay.",
      });
    }

    // Autres événements reçus (ex: transaction.failed, etc.)
    return NextResponse.json({
      success: true,
      received: true,
      event: eventName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne webhook";
    console.error("[SasPay Webhook Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
