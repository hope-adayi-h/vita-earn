import crypto from "crypto";

export interface SasPayConfig {
  apiKey?: string;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface SasPayCheckoutParams {
  amount: number; // Montant en FCFA (ex: 4500)
  currency?: string; // 'XOF'
  description?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnUrl: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface SasPayCheckoutResult {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
  raw?: unknown;
}

export interface SasPayPayoutParams {
  amount: number; // Montant net à verser (ex: 9500)
  currency?: string; // 'XOF'
  phoneNumber: string; // Ex: '+22890000000'
  accountName: string;
  paymentMethod: string; // 'tmoney', 'flooz', 'wave', 'mtn', 'orange', etc.
  description?: string;
  customerEmail?: string;
  idempotencyKey: string;
}

export interface SasPayPayoutResult {
  success: boolean;
  payoutId?: string;
  status?: "PENDING" | "SUCCESS" | "FAILED" | "PROCESSING";
  reference?: string;
  message?: string;
  error?: string;
  raw?: unknown;
}

export interface SasPayVerifyResult {
  success: boolean;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "UNKNOWN";
  amount?: number;
  netAmount?: number;
  currency?: string;
  transactionId?: string;
  raw?: unknown;
}

const DEFAULT_BASE_URL = "https://api.saspay.me/api/v1";

/**
 * Détecte le code pays ISO (2 lettres) à partir du numéro de téléphone ou de la méthode
 */
export function detectCountryAndMethod(phoneNumber: string, methodStr: string): {
  country: string;
  method: string;
  formattedPhone: string;
} {
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
  const mLower = methodStr.toLowerCase();

  let country = "TG";
  let formatted = cleanPhone;

  // Détection du pays d'après l'indicatif
  if (cleanPhone.startsWith("+228") || cleanPhone.startsWith("228")) {
    country = "TG";
    formatted = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
  } else if (cleanPhone.startsWith("+225") || cleanPhone.startsWith("225")) {
    country = "CI";
    formatted = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
  } else if (cleanPhone.startsWith("+229") || cleanPhone.startsWith("229")) {
    country = "BJ";
    formatted = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
  } else if (cleanPhone.startsWith("+221") || cleanPhone.startsWith("221")) {
    country = "SN";
    formatted = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
  } else if (cleanPhone.startsWith("+226") || cleanPhone.startsWith("226")) {
    country = "BF";
    formatted = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
  } else {
    // Par défaut Togo
    country = "TG";
    formatted = cleanPhone.startsWith("+") ? cleanPhone : `+228${cleanPhone}`;
  }

  // Détection du code méthode SasPay
  let method = "tg_tmoney";
  if (country === "TG") {
    if (mLower.includes("flooz") || mLower.includes("moov")) {
      method = "tg_moov";
    } else {
      method = "tg_tmoney";
    }
  } else if (country === "CI") {
    if (mLower.includes("wave")) method = "ci_wave";
    else if (mLower.includes("orange")) method = "ci_orange";
    else if (mLower.includes("mtn")) method = "ci_mtn";
    else if (mLower.includes("moov")) method = "ci_moov";
    else method = "ci_orange";
  } else if (country === "BJ") {
    if (mLower.includes("celtiis")) method = "bj_celtiis";
    else if (mLower.includes("moov")) method = "bj_moov";
    else method = "bj_mtn";
  } else if (country === "SN") {
    if (mLower.includes("wave")) method = "sn_wave";
    else if (mLower.includes("free")) method = "sn_free";
    else method = "sn_orange";
  } else if (country === "BF") {
    if (mLower.includes("moov")) method = "bf_moov";
    else method = "bf_orange";
  }

  return { country, method, formattedPhone: formatted };
}

export class SasPayClient {
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(config?: SasPayConfig) {
    this.apiKey = config?.apiKey || process.env.SASPAY_API_KEY || "";
    this.webhookSecret = config?.webhookSecret || process.env.SASPAY_WEBHOOK_SECRET || "";
    this.baseUrl = (config?.baseUrl || process.env.SASPAY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith("sk_"));
  }

  /**
   * Création d'une session de paiement hébergée (Hosted Checkout)
   * Utilisé pour le paiement d'activation (4 500 FCFA)
   */
  async createCheckoutSession(params: SasPayCheckoutParams): Promise<SasPayCheckoutResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: "Clé API SasPay non configurée sur le serveur.",
      };
    }

    // SasPay exige les montants en chaînes décimales exactes (ex: "4500.00")
    const formattedAmount = Number(params.amount).toFixed(2);
    const idempotencyKey = crypto.randomUUID();

    const payload: Record<string, unknown> = {
      amount: formattedAmount,
      currency: params.currency || "XOF",
      description: params.description || "Activation de compte VitaEarn",
      customer_email: params.customerEmail,
      customer_name: params.customerName,
      return_url: params.returnUrl,
    };

    if (params.customerPhone) {
      payload.customer_phone = params.customerPhone;
    }

    if (params.metadata) {
      payload.metadata = params.metadata;
    }

    try {
      const res = await fetch(`${this.baseUrl}/checkout-sessions/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          data?.error?.message ||
          data?.message ||
          `Erreur HTTP ${res.status} lors de l'appel SasPay`;
        return {
          success: false,
          error: errorMsg,
          raw: data,
        };
      }

      // Format SasPay : { success: true, data: { id, checkout_url, ... } }
      const sessionData = data?.data || data;
      const checkoutUrl = sessionData?.checkout_url;
      const sessionId = sessionData?.id;

      if (!checkoutUrl) {
        return {
          success: false,
          error: "URL de paiement non fournie dans la réponse SasPay.",
          raw: data,
        };
      }

      return {
        success: true,
        sessionId,
        checkoutUrl,
        raw: data,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur réseau inconnue";
      return {
        success: false,
        error: `Connexion à SasPay impossible : ${message}`,
      };
    }
  }

  /**
   * Vérification du statut d'un paiement ou d'une session
   */
  async verifyPayment(paymentOrSessionId: string): Promise<SasPayVerifyResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: "UNKNOWN",
      };
    }

    try {
      // 1. Essayer d'abord la vérification transaction / payment
      const res = await fetch(`${this.baseUrl}/payments/${encodeURIComponent(paymentOrSessionId)}/verify/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const tx = data?.data || data;
        const statusUpper = String(tx?.status || "").toUpperCase();

        let status: SasPayVerifyResult["status"] = "PENDING";
        if (["SUCCESS", "SUCCESSFUL", "PAID", "COMPLETED"].includes(statusUpper)) {
          status = "SUCCESS";
        } else if (["FAILED", "FAILURE", "EXPIRED"].includes(statusUpper)) {
          status = "FAILED";
        } else if (["CANCELLED", "CANCELED"].includes(statusUpper)) {
          status = "CANCELLED";
        }

        return {
          success: status === "SUCCESS",
          status,
          amount: tx?.amount ? Number(tx.amount) : undefined,
          netAmount: tx?.net_amount ? Number(tx.net_amount) : undefined,
          currency: tx?.currency || "XOF",
          transactionId: tx?.id,
          raw: data,
        };
      }

      // 2. Si non trouvé sous /payments/, vérifier sous /checkout-sessions/{id}/status/
      const sessionRes = await fetch(`${this.baseUrl}/checkout-sessions/${encodeURIComponent(paymentOrSessionId)}/status/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (sessionRes.ok) {
        const data = await sessionRes.json().catch(() => ({}));
        const sess = data?.data || data;
        const statusUpper = String(sess?.status || "").toUpperCase();

        let status: SasPayVerifyResult["status"] = "PENDING";
        if (["SUCCESS", "SUCCESSFUL", "PAID", "COMPLETED"].includes(statusUpper)) {
          status = "SUCCESS";
        } else if (["FAILED", "FAILURE", "EXPIRED"].includes(statusUpper)) {
          status = "FAILED";
        }

        return {
          success: status === "SUCCESS",
          status,
          amount: sess?.amount ? Number(sess.amount) : undefined,
          transactionId: sess?.id,
          raw: data,
        };
      }

      return {
        success: false,
        status: "UNKNOWN",
      };
    } catch {
      return {
        success: false,
        status: "UNKNOWN",
      };
    }
  }

  /**
   * Déclenche un virement sortant Mobile Money (Payout)
   * Appelé par l'administrateur après vérification humaine du retrait
   */
  async initializePayout(params: SasPayPayoutParams): Promise<SasPayPayoutResult> {
    if (!this.isConfigured()) {
      // Mode simulation sécurisé si les clés n'ont pas encore été renseignées
      return {
        success: true,
        status: "SUCCESS",
        payoutId: `sim_payout_${Date.now()}`,
        reference: `SAS-SIM-${Date.now().toString(36).toUpperCase()}`,
        message: "Simulation SasPay validée avec succès (clés non configurées).",
      };
    }

    const { country, method, formattedPhone } = detectCountryAndMethod(
      params.phoneNumber,
      params.paymentMethod
    );

    const nameParts = (params.accountName || "Client").trim().split(" ");
    const firstName = nameParts[0] || "Client";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Montant net en chaîne décimale (2 chiffres après la virgule)
    const formattedAmount = Number(params.amount).toFixed(2);

    const payload = {
      amount: formattedAmount,
      currency: params.currency || "XOF",
      country,
      method,
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: params.customerEmail || "payout@vitaearn.com",
      },
      recipient: {
        msisdn: formattedPhone,
      },
      description: params.description || `Retrait VitaEarn ${params.amount} FCFA`,
    };

    try {
      const res = await fetch(`${this.baseUrl}/payouts/initialize/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": params.idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errorMsg = "Erreur de virement SasPay";
        if (res.status === 403 && data?.error?.code === "ip_not_whitelisted") {
          errorMsg = "L'IP de votre serveur Netlify doit être whitelistée sur le dashboard SasPay.";
        } else if (res.status === 422 && data?.error?.code === "insufficient_balance") {
          errorMsg = "Solde insuffisant sur votre compte marchand SasPay pour honorer ce virement.";
        } else if (res.status === 422 && data?.error?.code === "currency_country_mismatch") {
          errorMsg = `Inadéquation pays/devise pour ${country}.`;
        } else if (data?.error?.message) {
          errorMsg = data.error.message;
        } else if (data?.message) {
          errorMsg = data.message;
        } else {
          errorMsg = `Erreur HTTP ${res.status}`;
        }

        return {
          success: false,
          error: errorMsg,
          raw: data,
        };
      }

      const payoutData = data?.data || data;
      return {
        success: true,
        payoutId: payoutData?.id || payoutData?.payout_id,
        status: (payoutData?.status || "SUCCESS").toUpperCase() as any,
        reference: payoutData?.reference || payoutData?.provider_ref || payoutData?.id,
        message: "Virement Mobile Money transmis à l'opérateur avec succès.",
        raw: data,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur réseau inconnue";
      return {
        success: false,
        error: `Connexion à l'API de virement SasPay impossible : ${message}`,
      };
    }
  }

  /**
   * Vérification de la signature d'un webhook SasPay
   * - Vérifie la fraîcheur de l'horodatage (< 300 secondes)
   * - Vérifie le HMAC SHA-256 sur le corps brut reçu
   */
  verifyWebhookSignature(params: {
    rawBody: string;
    signature: string;
    timestamp: string;
  }): boolean {
    if (!this.webhookSecret) {
      // Si aucun secret n'est configuré, rejet par précaution
      return false;
    }

    const { rawBody, signature, timestamp } = params;

    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;

    // Règle 6.1 : Rejeter si dérive > 300 secondes
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > 300) {
      return false;
    }

    try {
      const signedPayload = `${timestamp}.${rawBody}`;
      const expected = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedPayload)
        .digest("hex");

      const sigBuf = Buffer.from(signature.toLowerCase(), "utf8");
      const expBuf = Buffer.from(expected.toLowerCase(), "utf8");

      if (sigBuf.length !== expBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}
