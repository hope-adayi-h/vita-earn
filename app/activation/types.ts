export interface ActivationData {
  user: {
    id: string;
    email?: string;
    fullName: string;
    phone?: string | null;
  };
  isActivated: boolean;
  feeAmount: number;
  currency: string;
  pendingPayment?: {
    id: string;
    provider: string;
    providerRef: string | null;
    amount: number;
    status: string;
  } | null;
}
