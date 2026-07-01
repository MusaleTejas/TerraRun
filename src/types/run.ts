import type { Coordinates, TerritoryCell } from "./geo";

export type RunStatus = "idle" | "ready" | "running" | "paused" | "completed";

export type RunMetric = {
  label: string;
  value: string;
  unit?: string;
};

export type RunSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: RunStatus;
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number;
  path: Coordinates[];
  capturedCells: TerritoryCell[];
};
