export type LeaderboardEntry = {
  id: string;
  displayName: string;
  city: string;
  rank: number;
  weeklyDistanceMeters: number;
  capturedCells: number;
  trend: "up" | "down" | "flat";
};
