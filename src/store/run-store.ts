import { create } from "zustand";

import type { Coordinates, RunStatus, RunSession, TerritoryCell } from "@/types";
import { totalPathDistance } from "@/utils";
import { cellToCenter } from "@/lib/h3";
import { useSessionStore } from "./session-store";
import { saveFirebaseRun } from "@/lib/firebase";

type RunState = {
  status: RunStatus;
  startedAt: string | null;
  elapsedSeconds: number;
  path: Coordinates[];
  capturedCells: string[];
  completedRuns: RunSession[];
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  completeRun: () => void;
  resetRun: () => void;
  appendPoint: (point: Coordinates) => void;
  incrementDuration: (seconds: number) => void;
  addCapturedCell: (h3Index: string) => void;
};

export const useRunStore = create<RunState>((set) => ({
  status: "ready",
  startedAt: null,
  elapsedSeconds: 0,
  path: [],
  capturedCells: [],
  completedRuns: [],
  startRun: () =>
    set({
      status: "running",
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      path: [],
      capturedCells: [],
    }),
  pauseRun: () => set({ status: "paused" }),
  resumeRun: () => set({ status: "running" }),
  completeRun: () =>
    set((state) => {
      if (state.status !== "running" && state.status !== "paused") {
        return {};
      }
      
      const distance = totalPathDistance(state.path);
      const duration = state.elapsedSeconds;
      const pace = distance > 0 ? duration / (distance / 1000) : 0;
      
      const cells: TerritoryCell[] = state.capturedCells.map((h3Index) => ({
        h3Index,
        ownerId: "demo-runner",
        score: 100,
        center: cellToCenter(h3Index),
      }));

      const newSession: RunSession = {
        id: "run-" + Date.now(),
        startedAt: state.startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        status: "completed",
        distanceMeters: distance,
        durationSeconds: duration,
        paceSecondsPerKm: pace,
        path: state.path,
        capturedCells: cells,
      };

      // Sync user totals in the session store
      useSessionStore.getState().addRunStats(distance, state.capturedCells.length);

      // Sync run to Firestore if signed in with a real account
      const currentUser = useSessionStore.getState().user;
      if (currentUser && currentUser.id !== "demo-runner") {
        saveFirebaseRun(currentUser.id, newSession).catch((err) =>
          console.error("Failed to sync run details to Firestore:", err)
        );
      }

      return {
        status: "completed",
        completedRuns: [newSession, ...state.completedRuns],
      };
    }),
  resetRun: () =>
    set({
      status: "ready",
      startedAt: null,
      elapsedSeconds: 0,
      path: [],
      capturedCells: [],
    }),
  appendPoint: (point) =>
    set((state) => {
      if (state.status !== "running") return {};
      return {
        path: [...state.path, point],
      };
    }),
  incrementDuration: (seconds) =>
    set((state) => {
      if (state.status !== "running") return {};
      return {
        elapsedSeconds: state.elapsedSeconds + seconds,
      };
    }),
  addCapturedCell: (h3Index) =>
    set((state) => {
      if (state.status !== "running") return {};
      if (state.capturedCells.includes(h3Index)) return {};
      return {
        capturedCells: [...state.capturedCells, h3Index],
      };
    }),
}));

export function selectRunDistanceMeters(path: Coordinates[]): number {
  return totalPathDistance(path);
}

