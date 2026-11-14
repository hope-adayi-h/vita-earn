export type UserRole = "user" | "seller" | "admin";
export type KycStatus = "none" | "pending" | "verified" | "rejected";
export type PaymentPurpose = "activation" | "order_payment";
export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "cancelled";
export type ProductType = "physical" | "digital";
export type ProductStatus = "draft" | "pending" | "approved" | "rejected";
export type OrderStatus = "pending" | "paid" | "processing" | "completed" | "cancelled";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type WithdrawalMethod = "tmoney" | "flooz" | "wave" | "mtn_momo";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_activated: boolean;
  kyc_status: KycStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  wallet_id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

export interface LedgerEntry {
  id: string;
  wallet_id: string;
  amount: number;
  entry_type:
    | "activation_credit"
    | "sale_credit"
    | "withdrawal_debit"
    | "fee_debit"
    | "refund_credit"
    | "adjustment";
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  provider: string;
  provider_ref: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlatformSetting {
  key: string;
  value: {
    amount?: number;
    currency?: string;
    percent?: number;
    [key: string]: unknown;
  } | boolean | number | string;
  description: string | null;
  updated_at: string;
}
