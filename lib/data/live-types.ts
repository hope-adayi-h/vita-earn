export type LiveStatus = "pending" | "approved" | "rejected" | "live" | "ended";

export interface LiveConference {
  id: string;
  userId: string;
  applicantName: string;
  applicantPhone: string;
  title: string;
  description: string;
  category: string;
  scheduledDate: string; // Format: YYYY-MM-DD
  scheduledTime: string; // Format: HH:mm
  durationMinutes: number;
  meetUrl: string; // Lien Google Meet ou équivalent
  coverImageUrl?: string;
  status: LiveStatus;
  adminMessage?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveSubscription {
  liveId: string;
  userIdentifier: string;
  subscribedAt: string;
}

export interface LiveSettings {
  maxSlotsPerWeek: number; // default: 5 (modifiable par admin: 1, 2, 3, etc.)
  allowedDaysOfWeek: number[]; // 0=Dimanche, 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
  noticeMessage?: string;
  updatedAt: string;
}

export const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export const DEFAULT_LIVE_SETTINGS: LiveSettings = {
  maxSlotsPerWeek: 5,
  allowedDaysOfWeek: [1, 2, 3, 5, 0], // Lundi, Mardi, Mercredi, Vendredi, Dimanche par défaut
  noticeMessage: "",
  updatedAt: new Date().toISOString(),
};

export interface LiveAlertPayload {
  activeLive: LiveConference | null;
  imminentLive: LiveConference | null;
  tomorrowLive: LiveConference | null;
}
