export interface WheelSegment {
  index: number;
  amount: number;
  label: string;
  color: string;
  weight: number;
}

export const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  { index: 0, amount: 280, label: "XOF 280", color: "#EF4444", weight: 15 },
  { index: 1, amount: 400, label: "XOF 400", color: "#F97316", weight: 12 },
  { index: 2, amount: 112, label: "XOF 112", color: "#EAB308", weight: 20 },
  { index: 3, amount: 560, label: "XOF 560", color: "#84CC16", weight: 8 },
  { index: 4, amount: 800, label: "XOF 800", color: "#10B981", weight: 4 },
  { index: 5, amount: 168, label: "XOF 168", color: "#06B6D4", weight: 18 },
  { index: 6, amount: 840, label: "XOF 840", color: "#3B82F6", weight: 3 },
  { index: 7, amount: 56, label: "XOF 56", color: "#6366F1", weight: 100 },
  { index: 8, amount: 420, label: "XOF 420", color: "#EC4899", weight: 10 },
  { index: 9, amount: 224, label: "XOF 224", color: "#F59E0B", weight: 16 },
  { index: 10, amount: 120, label: "XOF 120", color: "#14B8A6", weight: 20 },
  { index: 11, amount: 200, label: "XOF 200", color: "#8B5CF6", weight: 18 },
];
