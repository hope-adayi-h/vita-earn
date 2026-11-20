/**
 * Source unique de vérité pour les pays pris en charge par SasPay
 * Extrait directement de l'API officielle SasPay (https://api.saspay.me/api/v1/pricing/my-rates/ et /countries/)
 */

export interface CountryOperator {
  code: string;
  name: string;
}

export interface CountryInfo {
  code: string; // Code ISO 3166-1 alpha-2 (ex: "TG", "BJ", "CI")
  name: string; // Nom officiel en français
  dialCode: string; // Indicatif téléphonique international (ex: "+228")
  currency: string; // Devise (ex: "XOF", "XAF", "USD")
  flagCode: string; // Code ISO pour le drapeau SVG
  payinOperators: CountryOperator[]; // Opérateurs pour encaissement / paiement
  payoutOperators: CountryOperator[]; // Opérateurs pour retrait Mobile Money
}

export const COUNTRIES: CountryInfo[] = [
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    currency: "XOF",
    flagCode: "BJ",
    payinOperators: [
      { code: "mtn_bj", name: "MTN MoMo Bénin" },
      { code: "moov_bj", name: "Moov Money Bénin" },
      { code: "celtiis_bj", name: "Celtiis Cash Bénin" },
    ],
    payoutOperators: [
      { code: "mtn_bj", name: "MTN MoMo Bénin" },
      { code: "moov_bj", name: "Moov Money Bénin" },
      { code: "celtiis_bj", name: "Celtiis Cash Bénin" },
    ],
  },
  {
    code: "BF",
    name: "Burkina Faso",
    dialCode: "+226",
    currency: "XOF",
    flagCode: "BF",
    payinOperators: [
      { code: "orange_bf", name: "Orange Money Burkina Faso" },
      { code: "moov_bf", name: "Moov Money Burkina Faso" },
    ],
    payoutOperators: [
      { code: "orange_bf", name: "Orange Money Burkina Faso" },
      { code: "moov_bf", name: "Moov Money Burkina Faso" },
    ],
  },
  {
    code: "CM",
    name: "Cameroun",
    dialCode: "+237",
    currency: "XAF",
    flagCode: "CM",
    payinOperators: [
      { code: "mtn_cm", name: "MTN MoMo Cameroun" },
      { code: "orange_cm", name: "Orange Money Cameroun" },
    ],
    payoutOperators: [
      { code: "mtn_cm", name: "MTN MoMo Cameroun" },
      { code: "orange_cm", name: "Orange Money Cameroun" },
    ],
  },
  {
    code: "CG",
    name: "Congo-Brazzaville",
    dialCode: "+242",
    currency: "XAF",
    flagCode: "CG",
    payinOperators: [
      { code: "airtel_cg", name: "Airtel Congo" },
      { code: "mtn_cg", name: "MTN Congo" },
    ],
    payoutOperators: [
      { code: "airtel_cg", name: "Airtel Congo" },
      { code: "mtn_cg", name: "MTN Congo" },
    ],
  },
  {
    code: "CD",
    name: "Congo-Kinshasa (RDC)",
    dialCode: "+243",
    currency: "CDF",
    flagCode: "CD",
    payinOperators: [
      { code: "vodacom_cd", name: "Vodacom M-Pesa RDC" },
      { code: "orange_cd", name: "Orange Money RDC" },
      { code: "airtel_cd", name: "Airtel Money RDC" },
      { code: "africell_cd", name: "Africell RDC" },
    ],
    payoutOperators: [
      { code: "vodacom_cd", name: "Vodacom M-Pesa RDC" },
      { code: "orange_cd", name: "Orange Money RDC" },
      { code: "airtel_cd", name: "Airtel Money RDC" },
      { code: "africell_cd", name: "Africell RDC" },
    ],
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    currency: "XOF",
    flagCode: "CI",
    payinOperators: [
      { code: "wave_ci", name: "Wave Côte d'Ivoire" },
      { code: "orange_ci", name: "Orange Money Côte d'Ivoire" },
      { code: "mtn_ci", name: "MTN MoMo Côte d'Ivoire" },
      { code: "moov_ci", name: "Moov Money Côte d'Ivoire" },
      { code: "djamo_ci", name: "Djamo Côte d'Ivoire" },
    ],
    payoutOperators: [
      { code: "wave_ci", name: "Wave Côte d'Ivoire" },
      { code: "orange_ci", name: "Orange Money Côte d'Ivoire" },
      { code: "mtn_ci", name: "MTN MoMo Côte d'Ivoire" },
      { code: "moov_ci", name: "Moov Money Côte d'Ivoire" },
      { code: "djamo_ci", name: "Djamo Côte d'Ivoire" },
    ],
  },
  {
    code: "XY",
    name: "Crypto (USDT / Stablecoin)",
    dialCode: "+1",
    currency: "USD",
    flagCode: "US",
    payinOperators: [
      { code: "crypto", name: "Crypto USDT (Tether)" },
    ],
    payoutOperators: [],
  },
  {
    code: "GA",
    name: "Gabon",
    dialCode: "+241",
    currency: "XAF",
    flagCode: "GA",
    payinOperators: [
      { code: "airtel_ga", name: "Airtel Money Gabon" },
      { code: "moov_ga", name: "Moov Money Gabon" },
    ],
    payoutOperators: [
      { code: "airtel_ga", name: "Airtel Money Gabon" },
      { code: "moov_ga", name: "Moov Money Gabon" },
    ],
  },
  {
    code: "GH",
    name: "Ghana",
    dialCode: "+233",
    currency: "GHS",
    flagCode: "GH",
    payinOperators: [
      { code: "mtn_gh", name: "MTN MoMo Ghana" },
      { code: "vodafone_gh", name: "Telecel / Vodafone Cash Ghana" },
      { code: "airteltigo_gh", name: "AT / AirtelTigo Ghana" },
    ],
    payoutOperators: [
      { code: "mtn_gh", name: "MTN MoMo Ghana" },
      { code: "vodafone_gh", name: "Telecel / Vodafone Cash Ghana" },
      { code: "airteltigo_gh", name: "AT / AirtelTigo Ghana" },
    ],
  },
  {
    code: "GN",
    name: "Guinée",
    dialCode: "+224",
    currency: "GNF",
    flagCode: "GN",
    payinOperators: [
      { code: "orange_gn", name: "Orange Money Guinée" },
    ],
    payoutOperators: [
      { code: "orange_gn", name: "Orange Money Guinée" },
    ],
  },
  {
    code: "XX",
    name: "International (Carte Bancaire)",
    dialCode: "+1",
    currency: "USD",
    flagCode: "UN",
    payinOperators: [
      { code: "card_usd", name: "Carte Bancaire Visa / Mastercard" },
    ],
    payoutOperators: [],
  },
  {
    code: "KE",
    name: "Kenya",
    dialCode: "+254",
    currency: "KES",
    flagCode: "KE",
    payinOperators: [
      { code: "mpesa_ke", name: "Safaricom M-Pesa Kenya" },
      { code: "airtel_ke", name: "Airtel Money Kenya" },
    ],
    payoutOperators: [
      { code: "mpesa_ke", name: "Safaricom M-Pesa Kenya" },
      { code: "airtel_ke", name: "Airtel Money Kenya" },
    ],
  },
  {
    code: "MW",
    name: "Malawi",
    dialCode: "+265",
    currency: "MWK",
    flagCode: "MW",
    payinOperators: [
      { code: "airtel_mw", name: "Airtel Money Malawi" },
      { code: "tnm_mw", name: "TNM Mpamba Malawi" },
    ],
    payoutOperators: [
      { code: "airtel_mw", name: "Airtel Money Malawi" },
      { code: "tnm_mw", name: "TNM Mpamba Malawi" },
    ],
  },
  {
    code: "ML",
    name: "Mali",
    dialCode: "+223",
    currency: "XOF",
    flagCode: "ML",
    payinOperators: [
      { code: "orange_ml", name: "Orange Money Mali" },
      { code: "moov_ml", name: "Moov Money Malitel" },
      { code: "wave_ml", name: "Wave Mali" },
    ],
    payoutOperators: [
      { code: "orange_ml", name: "Orange Money Mali" },
      { code: "moov_ml", name: "Moov Money Malitel" },
      { code: "wave_ml", name: "Wave Mali" },
    ],
  },
  {
    code: "MZ",
    name: "Mozambique",
    dialCode: "+258",
    currency: "MZN",
    flagCode: "MZ",
    payinOperators: [
      { code: "mpesa_mz", name: "M-Pesa Mozambique" },
      { code: "emola_mz", name: "e-Mola Mozambique" },
    ],
    payoutOperators: [
      { code: "mpesa_mz", name: "M-Pesa Mozambique" },
      { code: "emola_mz", name: "e-Mola Mozambique" },
    ],
  },
  {
    code: "NE",
    name: "Niger",
    dialCode: "+227",
    currency: "XOF",
    flagCode: "NE",
    payinOperators: [
      { code: "airtel_ne", name: "Airtel Money Niger" },
    ],
    payoutOperators: [
      { code: "airtel_ne", name: "Airtel Money Niger" },
    ],
  },
  {
    code: "NG",
    name: "Nigéria",
    dialCode: "+234",
    currency: "NGN",
    flagCode: "NG",
    payinOperators: [
      { code: "opay_ng", name: "OPay Nigéria" },
    ],
    payoutOperators: [],
  },
  {
    code: "UG",
    name: "Ouganda",
    dialCode: "+256",
    currency: "UGX",
    flagCode: "UG",
    payinOperators: [
      { code: "mtn_ug", name: "MTN MoMo Ouganda" },
      { code: "airtel_ug", name: "Airtel Money Ouganda" },
    ],
    payoutOperators: [
      { code: "mtn_ug", name: "MTN MoMo Ouganda" },
      { code: "airtel_ug", name: "Airtel Money Ouganda" },
    ],
  },
  {
    code: "XC",
    name: "RDC (USD)",
    dialCode: "+243",
    currency: "USD",
    flagCode: "CD",
    payinOperators: [
      { code: "vodacom_xc", name: "Vodacom M-Pesa RDC (USD)" },
      { code: "orange_xc", name: "Orange Money RDC (USD)" },
      { code: "airtel_xc", name: "Airtel Money RDC (USD)" },
    ],
    payoutOperators: [
      { code: "vodacom_xc", name: "Vodacom M-Pesa RDC (USD)" },
      { code: "orange_xc", name: "Orange Money RDC (USD)" },
      { code: "airtel_xc", name: "Airtel Money RDC (USD)" },
    ],
  },
  {
    code: "RW",
    name: "Rwanda",
    dialCode: "+250",
    currency: "RWF",
    flagCode: "RW",
    payinOperators: [
      { code: "mtn_rw", name: "MTN MoMo Rwanda" },
      { code: "airtel_rw", name: "Airtel Money Rwanda" },
    ],
    payoutOperators: [
      { code: "mtn_rw", name: "MTN MoMo Rwanda" },
      { code: "airtel_rw", name: "Airtel Money Rwanda" },
    ],
  },
  {
    code: "SN",
    name: "Sénégal",
    dialCode: "+221",
    currency: "XOF",
    flagCode: "SN",
    payinOperators: [
      { code: "wave_sn", name: "Wave Sénégal" },
      { code: "orange_sn", name: "Orange Money Sénégal" },
      { code: "freemoney_sn", name: "Free Money Sénégal" },
      { code: "djamo_sn", name: "Djamo Sénégal" },
      { code: "expresso_sn", name: "Expresso Sénégal" },
      { code: "wizall_sn", name: "Wizall Sénégal" },
      { code: "paydunya_sn", name: "Compte PayDunya" },
    ],
    payoutOperators: [
      { code: "wave_sn", name: "Wave Sénégal" },
      { code: "orange_sn", name: "Orange Money Sénégal" },
      { code: "freemoney_sn", name: "Free Money Sénégal" },
      { code: "djamo_sn", name: "Djamo Sénégal" },
      { code: "expresso_sn", name: "Expresso Sénégal" },
      { code: "wizall_sn", name: "Wizall Sénégal" },
      { code: "paydunya_sn", name: "Compte PayDunya" },
    ],
  },
  {
    code: "SL",
    name: "Sierra Leone",
    dialCode: "+232",
    currency: "SLE",
    flagCode: "SL",
    payinOperators: [
      { code: "orange_sl", name: "Orange Money Sierra Leone" },
    ],
    payoutOperators: [
      { code: "orange_sl", name: "Orange Money Sierra Leone" },
    ],
  },
  {
    code: "TZ",
    name: "Tanzanie",
    dialCode: "+255",
    currency: "TZS",
    flagCode: "TZ",
    payinOperators: [
      { code: "mpesa_tz", name: "Vodacom M-Pesa Tanzanie" },
      { code: "tigo_tz", name: "Tigo Pesa Tanzanie" },
      { code: "airtel_tz", name: "Airtel Money Tanzanie" },
      { code: "halopesa_tz", name: "Halopesa Tanzanie" },
    ],
    payoutOperators: [
      { code: "mpesa_tz", name: "Vodacom M-Pesa Tanzanie" },
      { code: "tigo_tz", name: "Tigo Pesa Tanzanie" },
      { code: "airtel_tz", name: "Airtel Money Tanzanie" },
      { code: "halopesa_tz", name: "Halopesa Tanzanie" },
    ],
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "+228",
    currency: "XOF",
    flagCode: "TG",
    payinOperators: [
      { code: "togocel", name: "T-Money (Togocel)" },
      { code: "moov_tg", name: "Moov Flooz (Moov Money)" },
      { code: "mixx_tg", name: "Mixx Togo" },
    ],
    payoutOperators: [
      { code: "togocel", name: "T-Money (Togocel)" },
      { code: "moov_tg", name: "Moov Flooz (Moov Money)" },
    ],
  },
  {
    code: "ZM",
    name: "Zambie",
    dialCode: "+260",
    currency: "ZMW",
    flagCode: "ZM",
    payinOperators: [
      { code: "mtn_zm", name: "MTN MoMo Zambie" },
      { code: "airtel_zm", name: "Airtel Money Zambie" },
      { code: "zamtel_zm", name: "Zamtel Zambie" },
    ],
    payoutOperators: [
      { code: "mtn_zm", name: "MTN MoMo Zambie" },
      { code: "airtel_zm", name: "Airtel Money Zambie" },
      { code: "zamtel_zm", name: "Zamtel Zambie" },
    ],
  },
];

/**
 * Récupère tous les pays triés par ordre alphabétique en français
 */
export function getAllCountries(): CountryInfo[] {
  return [...COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
  );
}

/**
 * Retrouve un pays par son code ISO à 2 lettres (ex: "TG", "BJ")
 */
export function getCountryByCode(code?: string | null): CountryInfo | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return COUNTRIES.find((c) => c.code === upper);
}

/**
 * Retrouve un pays par son indicatif téléphonique (ex: "+228", "228")
 */
export function getCountryByDialCode(dialCode?: string | null): CountryInfo | undefined {
  if (!dialCode) return undefined;
  const clean = dialCode.trim().replace(/^00/, "+");
  const formatted = clean.startsWith("+") ? clean : `+${clean}`;
  return COUNTRIES.find((c) => c.dialCode === formatted);
}

/**
 * Détecte le pays à partir d'un numéro de téléphone complet (ex: "+22890123456" => Togo)
 */
export function detectCountryFromPhone(phone?: string | null): CountryInfo {
  if (!phone) return getCountryByCode("TG")!;
  const clean = phone.trim().replace(/[\s\-\(\)]/g, "");

  // Recherche par indicatif le plus long d'abord
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    const rawDial = c.dialCode.replace("+", "");
    if (clean.startsWith(c.dialCode) || clean.startsWith(rawDial)) {
      return c;
    }
  }

  return getCountryByCode("TG")!;
}
