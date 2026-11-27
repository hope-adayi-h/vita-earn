export type AdminNotificationType = "withdrawal" | "kyc" | "live" | "product" | "deposit";

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  subtitle: string;
  detail?: string;
  amount?: number;
  userName?: string;
  href: string;
  actionLabel: string;
  createdAt: string;
}

export interface AdminNotificationSummary {
  totalCount: number;
  withdrawalsCount: number;
  kycCount: number;
  liveCount: number;
  productsCount: number;
  depositsCount: number;
  items: AdminNotificationItem[];
  lastCheckedAt: string;
}
